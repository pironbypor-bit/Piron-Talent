-- Piron Work | migration 0045 | Piron Work Space step 1: owner flag, audit log, overview numbers
-- Run after 0044_organiser_identity_and_trigger_grants.sql. Only the owner can read the overview or the audit log.
begin;

alter table public.admins add column if not exists is_owner boolean not null default false;
update public.admins set is_owner = true where user_id = 'ec5d079f-0c39-4941-adec-d7a9401441f2';

create function public.is_owner() returns boolean language sql stable security definer set search_path = '' as $$
 select exists (select 1 from public.admins where user_id = (select auth.uid()) and is_owner)
$$;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- Audit log: what an admin did. Written only through log_admin_action; read only by the owner.
create table public.audit_log (
 id bigint generated always as identity primary key,
 actor_id uuid references public.profiles(id) on delete set null,
 action text not null check (char_length(action) between 1 and 80),
 target text check (target is null or char_length(target) <= 200),
 created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
create policy audit_log_owner_read on public.audit_log for select to authenticated using (public.is_owner());

create function public.log_admin_action(p_action text, p_target text default null) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not exists (select 1 from public.admins where user_id = (select auth.uid())) then raise exception 'admin only'; end if;
 insert into public.audit_log(actor_id, action, target) values ((select auth.uid()), left(p_action, 80), left(p_target, 200));
end;$$;
revoke execute on function public.log_admin_action(text, text) from public, anon;
grant execute on function public.log_admin_action(text, text) to authenticated;

-- The Overview: needs, today vs yesterday, totals, 14 day signups, last email / push / reminder run, recent actions.
create function public.space_overview() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
 d0 timestamptz := date_trunc('day', now() at time zone 'Asia/Phnom_Penh') at time zone 'Asia/Phnom_Penh';
 d1 timestamptz := (date_trunc('day', now() at time zone 'Asia/Phnom_Penh') - interval '1 day') at time zone 'Asia/Phnom_Penh';
 r jsonb;
begin
 if not public.is_owner() then return null; end if;
 select jsonb_build_object(
  'needs', jsonb_build_object(
   'identity', (select count(*) from public.identity_checks where status = 'pending'),
   'reports', (select count(*) from public.reports where status = 'open'),
   'payouts', (select count(*) from public.payout_accounts where status = 'pending'),
   'requests', (select count(*) from public.project_requests where status = 'new'),
   'applications', (select count(*) from public.provider_applications where status = 'new'),
   'disputes', (select count(*) from public.disputes where status in ('open', 'reviewing'))),
  'today', jsonb_build_object(
   'users', jsonb_build_array((select count(*) from public.profiles where created_at >= d0), (select count(*) from public.profiles where created_at >= d1 and created_at < d0)),
   'posts', jsonb_build_array((select count(*) from public.posts where created_at >= d0), (select count(*) from public.posts where created_at >= d1 and created_at < d0)),
   'quotes', jsonb_build_array((select count(*) from public.quotes where post_id is not null and created_at >= d0), (select count(*) from public.quotes where post_id is not null and created_at >= d1 and created_at < d0)),
   'accepted', jsonb_build_array((select count(*) from public.project_jobs where created_at >= d0), (select count(*) from public.project_jobs where created_at >= d1 and created_at < d0)),
   'confirmed', jsonb_build_array((select count(*) from public.project_jobs where status = 'confirmed' and confirmed_at >= d0), (select count(*) from public.project_jobs where status = 'confirmed' and confirmed_at >= d1 and confirmed_at < d0)),
   'active', (select count(*) from auth.users where last_sign_in_at >= d0)),
  'totals', jsonb_build_object(
   'users', (select count(*) from public.profiles),
   'providers', (select count(*) from public.profiles where is_available),
   'identity_checked', (select count(*) from public.profiles where identity_checked),
   'companies', (select count(*) from public.businesses),
   'open_posts', (select count(*) from public.posts where status = 'published'),
   'confirmed_jobs', (select count(*) from public.project_jobs where status = 'confirmed')),
  'growth', (select jsonb_agg(jsonb_build_object('day', g.d::date, 'n', (select count(*) from public.profiles p where p.created_at >= g.d and p.created_at < g.d + interval '1 day')) order by g.d)
   from (select generate_series(d0 - interval '13 days', d0, interval '1 day') as d) g),
  'reminders', (select jsonb_build_object('at', j.start_time, 'status', j.status) from cron.job_run_details j
   where j.jobid = (select jobid from cron.job where jobname = 'piron-reminders') order by j.start_time desc limit 1),
  'email', (select jsonb_build_object('at', created, 'status', status_code) from net._http_response where content like '%messageId%' order by created desc limit 1),
  'push', (select jsonb_build_object('at', created, 'status', status_code) from net._http_response where content like '%"sent"%' order by created desc limit 1),
  'send_failed_24h', (select count(*) from net._http_response where created > now() - interval '24 hours' and (status_code >= 400 or timed_out or error_msg is not null)),
  'recent', coalesce((select jsonb_agg(jsonb_build_object('at', a.created_at, 'action', a.action, 'target', a.target) order by a.created_at desc)
   from (select * from public.audit_log order by created_at desc limit 6) a), '[]'::jsonb)
 ) into r;
 return r;
end;$$;
revoke execute on function public.space_overview() from public, anon;
grant execute on function public.space_overview() to authenticated;

commit;
