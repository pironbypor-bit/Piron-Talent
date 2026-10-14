-- Piron Talent | migration 0014 | fix: quotes_add compared project_jobs.post_id with itself (unqualified post_id
-- inside the subquery bound to the inner table), so one active job anywhere blocked every new quote. Found 2026-10-14.
-- The check now goes through a security-definer helper, so a provider's own row visibility cannot hide another
-- provider's active job on the same post.
begin;

create or replace function public.post_has_active_job(p_post uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.project_jobs j where j.post_id = p_post and j.status in ('accepted','delivered','confirmed'))
$$;
revoke execute on function public.post_has_active_job(uuid) from public, anon;
grant execute on function public.post_has_active_job(uuid) to authenticated;

drop policy quotes_add on public.quotes;
create policy quotes_add on public.quotes for insert to authenticated with check(
 provider_id=(select auth.uid()) and status='pending'
 and public.quote_target_owner(post_id, job_id) <> (select auth.uid())
 and ((post_id is not null and exists(select 1 from public.posts p where p.id=quotes.post_id and p.status='published' and p.kind='need_help')
       and not public.post_has_active_job(quotes.post_id))
   or (job_id is not null and exists(select 1 from public.jobs j where j.id=quotes.job_id and j.status='published')))
);

commit;
