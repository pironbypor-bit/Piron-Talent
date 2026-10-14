-- Piron Talent | migration 0020 | companies on the profile (owner decision 2026-10-14, design A)
-- Run after 0019_all_provinces.sql. A person creates a company; the owner membership is written here because
-- business_members has no insert policy on purpose (memberships only through trusted code).
begin;

create function public.create_business(p_name text, p_kind text, p_city text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_id uuid;
begin
 if v_me is null then raise exception 'not signed in' using errcode = '42501'; end if;
 if length(trim(p_name)) < 2 or length(p_name) > 80 then raise exception 'name' using errcode = '22023'; end if;
 if (select count(*) from public.businesses where owner_id = v_me) >= 10 then raise exception 'too many' using errcode = '22023'; end if;
 insert into public.businesses(owner_id, name, description, city) values (v_me, trim(p_name), nullif(trim(coalesce(p_kind, '')), ''), nullif(trim(coalesce(p_city, '')), '')) returning id into v_id;
 insert into public.business_members(business_id, user_id, role) values (v_id, v_me, 'owner');
 return v_id;
end;$$;
revoke execute on function public.create_business(text, text, text) from public, anon;
grant execute on function public.create_business(text, text, text) to authenticated;

-- Posters see the applicants of their company jobs too.
drop policy applications_read on public.job_applications;
create policy applications_read on public.job_applications for select to authenticated using (
 applicant_id = (select auth.uid())
 or exists (select 1 from public.jobs j where j.id = job_applications.job_id and (j.poster_id = (select auth.uid()) or (j.business_id is not null and public.is_business_member(j.business_id))))
);

commit;
