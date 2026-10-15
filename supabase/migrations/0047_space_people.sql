-- Piron Work | migration 0047 | Piron Work Space step 2: People (summary, list, person, pause)
-- Run after 0046_profile_column_privileges.sql. Everything here is owner only (is_owner()). No email, phone or ID number is returned.
begin;

-- Set by space_set_paused only. paused_at is NOT in the column grant of 0046, so people cannot clear it themselves.
alter table public.profiles add column paused_at timestamptz;

create function public.space_people_summary() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d0 timestamptz := date_trunc('day', now() at time zone 'Asia/Phnom_Penh') at time zone 'Asia/Phnom_Penh';
begin
 if not public.is_owner() then return null; end if;
 return jsonb_build_object(
  'total', (select count(*) from public.profiles),
  'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
  'new_30d', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
  'providers', (select count(*) from public.profiles where is_available),
  'identity_checked', (select count(*) from public.profiles where identity_checked),
  'paused', (select count(*) from public.profiles where paused_at is not null),
  'active_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
  'growth', (select jsonb_agg(jsonb_build_object('day', (g.d at time zone 'Asia/Phnom_Penh')::date, 'n', (select count(*) from public.profiles p where p.created_at >= g.d and p.created_at < g.d + interval '1 day')) order by g.d)
   from (select generate_series(d0 - interval '29 days', d0, interval '1 day') as d) g),
  'cities', coalesce((select jsonb_agg(jsonb_build_object('city', x.c, 'n', x.n) order by x.n desc)
   from (select coalesce(city, 'Not set') as c, count(*) as n from public.profiles group by 1 order by 2 desc limit 8) x), '[]'::jsonb));
end;$$;

create function public.space_people(p_q text default null, p_filter text default 'all', p_limit int default 50) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare w text := '%' || replace(replace(coalesce(trim(p_q), ''), '%', ''), '_', '') || '%';
begin
 if not public.is_owner() then return null; end if;
 return coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from (
  select p.id, p.display_name, p.role_line, p.city, p.created_at, p.is_available, p.identity_checked, p.paused_at,
   (select u.last_sign_in_at from auth.users u where u.id = p.id) as last_sign_in_at,
   (select count(*) from public.posts x where x.author_id = p.id) as posts,
   (select count(*) from public.project_jobs j where j.customer_id = p.id or j.provider_id = p.id) as jobs
  from public.profiles p
  where (coalesce(trim(p_q), '') = '' or p.display_name ilike w or p.role_line ilike w or p.username ilike w or p.city ilike w)
   and case coalesce(p_filter, 'all')
        when 'providers' then p.is_available
        when 'checked' then p.identity_checked
        when 'paused' then p.paused_at is not null
        when 'new' then p.created_at > now() - interval '7 days'
        else true end
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)) r), '[]'::jsonb);
end;$$;

create function public.space_person(p_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
 if not public.is_owner() then return null; end if;
 select jsonb_build_object(
  'id', p.id, 'display_name', p.display_name, 'role_line', p.role_line, 'bio', p.bio, 'city', p.city, 'district', p.district,
  'created_at', p.created_at, 'is_available', p.is_available, 'identity_checked', p.identity_checked, 'completed_jobs', p.completed_jobs,
  'paused_at', p.paused_at, 'is_admin', exists (select 1 from public.admins a where a.user_id = p.id),
  'last_sign_in_at', (select u.last_sign_in_at from auth.users u where u.id = p.id),
  'posts', (select count(*) from public.posts x where x.author_id = p.id),
  'quotes', (select count(*) from public.quotes q where q.provider_id = p.id and q.post_id is not null),
  'jobs_as_customer', (select count(*) from public.project_jobs j where j.customer_id = p.id),
  'jobs_as_provider', (select count(*) from public.project_jobs j where j.provider_id = p.id),
  'reviews', (select count(*) from public.reviews v where v.subject_id = p.id),
  'avg_stars', (select round(avg(v.stars)::numeric, 2) from public.reviews v where v.subject_id = p.id),
  'reports_against', (select count(*) from public.reports x where x.target_type = 'user' and x.target_id = p.id),
  'reports_filed', (select count(*) from public.reports x where x.reporter_id = p.id),
  'companies', (select count(*) from public.business_members m where m.user_id = p.id),
  'recent_posts', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'title', t.title, 'kind', t.kind, 'status', t.status, 'created_at', t.created_at) order by t.created_at desc)
   from (select * from public.posts x where x.author_id = p.id order by x.created_at desc limit 5) t), '[]'::jsonb)
 ) into r from public.profiles p where p.id = p_id;
 return r;
end;$$;

create function public.space_set_paused(p_id uuid, p_paused boolean, p_note text default null) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
 if p_id = (select auth.uid()) then raise exception 'you cannot pause yourself'; end if;
 if exists (select 1 from public.admins where user_id = p_id) then raise exception 'an admin cannot be paused'; end if;
 update public.profiles set
  paused_at = case when p_paused then now() else null end,
  is_available = case when p_paused then false else is_available end,
  available_until = case when p_paused then null else available_until end,
  record_public = case when p_paused then false else record_public end
 where id = p_id;
 if not found then raise exception 'person not found'; end if;
 insert into public.audit_log(actor_id, action, target)
  values ((select auth.uid()), case when p_paused then 'Account paused' else 'Account resumed' end, left(p_id::text || coalesce(' · ' || nullif(trim(p_note), ''), ''), 200));
end;$$;

revoke execute on function public.space_people_summary() from public, anon;
revoke execute on function public.space_people(text, text, int) from public, anon;
revoke execute on function public.space_person(uuid) from public, anon;
revoke execute on function public.space_set_paused(uuid, boolean, text) from public, anon;
grant execute on function public.space_people_summary() to authenticated;
grant execute on function public.space_people(text, text, int) to authenticated;
grant execute on function public.space_person(uuid) to authenticated;
grant execute on function public.space_set_paused(uuid, boolean, text) to authenticated;

commit;
