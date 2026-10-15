-- Piron Work | migration 0035 | admin numbers (one page for the owner)
-- Run after 0034_company_files_manager_read.sql. Returns null for anyone who is not in public.admins.
begin;

create function public.admin_kpis() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r jsonb;
begin
 if not exists (select 1 from public.admins where user_id = (select auth.uid())) then return null; end if;
 select jsonb_build_object(
  'people', jsonb_build_object(
   'total', (select count(*) from public.profiles),
   'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
   'new_30d', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
   'providers', (select count(*) from public.profiles where is_available),
   'identity_checked', (select count(*) from public.profiles where identity_checked),
   'with_record', (select count(*) from public.profiles where completed_jobs > 0)),
  'market', jsonb_build_object(
   'projects', (select count(*) from public.posts where kind = 'need_help'),
   'projects_30d', (select count(*) from public.posts where kind = 'need_help' and created_at > now() - interval '30 days'),
   'projects_with_quote', (select count(distinct post_id) from public.quotes where post_id is not null),
   'quotes', (select count(*) from public.quotes where post_id is not null),
   'quotes_30d', (select count(*) from public.quotes where post_id is not null and created_at > now() - interval '30 days'),
   'accepted', (select count(*) from public.project_jobs),
   'delivered', (select count(*) from public.project_jobs where status in ('delivered','confirmed')),
   'confirmed', (select count(*) from public.project_jobs where status = 'confirmed'),
   'cancelled', (select count(*) from public.project_jobs where status = 'cancelled'),
   'reviews', (select count(*) from public.reviews),
   'avg_stars', (select round(avg(stars)::numeric, 2) from public.reviews),
   'hours_to_first_quote', (select round((percentile_cont(0.5) within group (order by extract(epoch from (fq.first_at - p.created_at)) / 3600))::numeric, 1)
     from (select q.post_id, min(q.created_at) as first_at from public.quotes q where q.post_id is not null group by q.post_id) fq
     join public.posts p on p.id = fq.post_id)),
  'intake', jsonb_build_object(
   'requests', (select count(*) from public.project_requests),
   'requests_30d', (select count(*) from public.project_requests where created_at > now() - interval '30 days'),
   'applications', (select count(*) from public.provider_applications),
   'by_source', coalesce((select jsonb_agg(jsonb_build_object('source', s.src, 'n', s.n) order by s.n desc)
     from (select coalesce(source, 'direct') as src, count(*) as n from public.project_requests where created_at > now() - interval '90 days' group by 1 order by 2 desc limit 8) s), '[]'::jsonb)),
  'community', jsonb_build_object(
   'companies', (select count(*) from public.businesses),
   'public_pages', (select count(*) from public.businesses where page_public),
   'open_activities', (select count(*) from public.activities where status = 'open' and ends_at > now()),
   'activity_joins', (select count(*) from public.activity_members),
   'messages_7d', (select count(*) from public.messages where created_at > now() - interval '7 days'),
   'open_jobs', (select count(*) from public.jobs where status = 'published')),
  'weekly', coalesce((select jsonb_agg(jsonb_build_object(
     'week', w::date,
     'signups', (select count(*) from public.profiles where created_at >= w and created_at < w + interval '7 days'),
     'projects', (select count(*) from public.posts where kind = 'need_help' and created_at >= w and created_at < w + interval '7 days'),
     'quotes', (select count(*) from public.quotes where post_id is not null and created_at >= w and created_at < w + interval '7 days'),
     'confirmed', (select count(*) from public.project_jobs where status = 'confirmed' and confirmed_at >= w and confirmed_at < w + interval '7 days')) order by w)
    from generate_series(date_trunc('week', now()) - interval '7 weeks', date_trunc('week', now()), interval '1 week') w), '[]'::jsonb)
 ) into r;
 return r;
end;$$;
revoke execute on function public.admin_kpis() from public, anon;
grant execute on function public.admin_kpis() to authenticated;

commit;
