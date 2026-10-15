-- Piron Work | migration 0049 | Piron Work Space step 4: app errors (grouped, alert when one repeats)
-- Run after 0048_space_marketplace.sql. Anyone (including visitors) can report an error through log_app_error,
-- which is capped; only the owner can read or change them.
begin;

create table public.app_errors (
 id bigint generated always as identity primary key,
 fingerprint text not null unique,
 source text not null check (source in ('page', 'action', 'route', 'job', 'browser')),
 message text not null,
 path text,
 user_id uuid,
 count int not null default 1,
 first_seen timestamptz not null default now(),
 last_seen timestamptz not null default now(),
 window_start timestamptz not null default now(),
 window_count int not null default 1,
 alerted_at timestamptz,
 status text not null default 'open' check (status in ('open', 'fixed', 'ignored'))
);
create index app_errors_last_seen_idx on public.app_errors (last_seen desc);
alter table public.app_errors enable row level security;
revoke all on public.app_errors from anon, authenticated;
grant select on public.app_errors to authenticated;
create policy app_errors_owner_read on public.app_errors for select to authenticated using (public.is_owner());

create function public.log_app_error(p_source text, p_message text, p_path text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
 v_msg text := left(trim(coalesce(p_message, '')), 300);
 v_path text := left(trim(coalesce(p_path, '')), 200);
 v_src text := case when p_source in ('page', 'action', 'route', 'job', 'browser') then p_source else 'page' end;
 v_fp text;
 r public.app_errors;
 o record;
begin
 if v_msg = '' then return; end if;
 -- Flood guards: at most 100 reports a minute, at most 2000 distinct errors kept.
 if (select count(*) from public.app_errors where last_seen > now() - interval '1 minute') > 100 then return; end if;
 v_fp := md5(v_src || '|' || regexp_replace(lower(v_msg), '[0-9a-f]{8}-[0-9a-f-]{27}', '#', 'g') || '|' || regexp_replace(v_path, '[0-9a-f]{8}-[0-9a-f-]{27}', '[id]', 'g'));
 if (select count(*) from public.app_errors) >= 2000 and not exists (select 1 from public.app_errors where fingerprint = v_fp) then return; end if;
 insert into public.app_errors as e (fingerprint, source, message, path, user_id)
 values (v_fp, v_src, v_msg, nullif(v_path, ''), (select auth.uid()))
 on conflict (fingerprint) do update set
  count = e.count + 1,
  last_seen = now(),
  user_id = coalesce(excluded.user_id, e.user_id),
  status = case when e.status = 'fixed' then 'open' else e.status end,
  window_start = case when now() - e.window_start > interval '10 minutes' then now() else e.window_start end,
  window_count = case when now() - e.window_start > interval '10 minutes' then 1 else e.window_count + 1 end
 returning * into r;
 -- Five in ten minutes: tell the owner, at most once an hour per error and at most 3 alerts an hour in total.
 if r.window_count >= 5 and r.status = 'open' and (r.alerted_at is null or r.alerted_at < now() - interval '1 hour')
    and (select count(*) from public.notifications where title = 'App error repeating' and created_at > now() - interval '1 hour') < 3 then
  update public.app_errors set alerted_at = now() where id = r.id;
  for o in select user_id from public.admins where is_owner loop
   perform public.notify(o.user_id, 'App error repeating', left(r.message, 140) || ' (' || r.window_count || ' times in 10 minutes)', '/admin/space/errors');
  end loop;
 end if;
exception when others then
 return; -- reporting an error must never raise one
end;$$;
revoke execute on function public.log_app_error(text, text, text) from public;
grant execute on function public.log_app_error(text, text, text) to anon, authenticated;

create function public.space_errors(p_status text default 'open') returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_owner() then return null; end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x.last_seen desc) from (
  select e.id, e.source, e.message, e.path, e.count, e.first_seen, e.last_seen, e.status,
   (select display_name from public.profiles p where p.id = e.user_id) as last_person
  from public.app_errors e
  where coalesce(p_status, 'open') = 'all' or e.status = coalesce(p_status, 'open')
  order by e.last_seen desc limit 100) x), '[]'::jsonb);
end;$$;

create function public.space_set_error_status(p_id bigint, p_status text) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
 if p_status not in ('open', 'fixed', 'ignored') then raise exception 'bad status'; end if;
 update public.app_errors set status = p_status, window_count = 1, window_start = now(), alerted_at = null where id = p_id;
 if not found then raise exception 'error not found'; end if;
 insert into public.audit_log(actor_id, action, target) values ((select auth.uid()), 'Error marked ' || p_status, p_id::text);
end;$$;

create function public.space_errors_badge() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_owner() then return null; end if;
 return jsonb_build_object(
  'open', (select count(*) from public.app_errors where status = 'open'),
  'repeating', (select count(*) from public.app_errors where status = 'open' and window_count >= 5 and last_seen > now() - interval '1 hour'));
end;$$;

-- Failed email or push calls and the last reminder runs, with addresses removed from the text.
create function public.space_send_log() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_owner() then return null; end if;
 return jsonb_build_object(
  'failed', coalesce((select jsonb_agg(to_jsonb(f) order by f.at desc) from (
    select created as at, status_code as status, left(regexp_replace(coalesce(error_msg, content, ''), '[^ "@]+@[^ "]+', '[email]', 'g'), 120) as note
    from net._http_response where status_code >= 400 or timed_out or error_msg is not null order by created desc limit 15) f), '[]'::jsonb),
  'reminders', coalesce((select jsonb_agg(to_jsonb(r) order by r.at desc) from (
    select start_time as at, status from cron.job_run_details
    where jobid = (select jobid from cron.job where jobname = 'piron-reminders') order by start_time desc limit 8) r), '[]'::jsonb));
end;$$;

revoke execute on function public.space_errors(text) from public, anon;
revoke execute on function public.space_set_error_status(bigint, text) from public, anon;
revoke execute on function public.space_errors_badge() from public, anon;
revoke execute on function public.space_send_log() from public, anon;
grant execute on function public.space_errors(text) to authenticated;
grant execute on function public.space_set_error_status(bigint, text) to authenticated;
grant execute on function public.space_errors_badge() to authenticated;
grant execute on function public.space_send_log() to authenticated;

select cron.schedule('piron-clean-errors', '17 3 * * *', $$delete from public.app_errors where last_seen < now() - interval '60 days'$$);

commit;
