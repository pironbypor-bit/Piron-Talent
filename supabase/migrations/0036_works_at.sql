-- Piron Work | migration 0036 | "Works at" line on a public profile
-- Run after 0035_admin_kpis.sql. Each person decides for themselves; it is off by default and only shows
-- while the company page is public, so the line always has a page to link to.
begin;

alter table public.business_members add column show_on_profile boolean not null default false;

create function public.set_show_on_profile(p_business uuid, p_show boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 update public.business_members set show_on_profile = coalesce(p_show, false)
 where business_id = p_business and user_id = (select auth.uid());
end;$$;

create function public.profile_works_at(p_user uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'name', b.name, 'job_title', m.job_title, 'role', m.role) order by b.name), '[]'::jsonb)
 from public.business_members m join public.businesses b on b.id = m.business_id
 where m.user_id = p_user and m.show_on_profile and b.page_public
$$;

revoke execute on function public.set_show_on_profile(uuid, boolean) from public, anon;
grant execute on function public.set_show_on_profile(uuid, boolean) to authenticated;
grant execute on function public.profile_works_at(uuid) to anon, authenticated;

commit;
