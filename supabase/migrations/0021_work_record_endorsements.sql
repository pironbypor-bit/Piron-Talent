-- Piron Talent | migration 0021 | profile for everyone: work record and skill endorsements (2026-10-14)
-- Run after 0020_companies.sql in the Supabase SQL editor.
begin;

-- 1. Work record: confirmed jobs on a profile. A person can hide their own record; the other party's name shows
--    only when that person also keeps their record public, so both agreed.
alter table public.profiles add column record_public boolean not null default true;

create function public.work_record(p_user uuid)
returns table(job_id uuid, title text, completed_at timestamptz, role text, other_name text, other_id uuid)
language sql stable security definer set search_path='' as $$
 select j.id, p.title, j.confirmed_at,
        case when j.provider_id = p_user then 'provider' else 'customer' end,
        case when o.record_public then o.display_name else null end,
        case when o.record_public then o.id else null end
 from public.project_jobs j
 join public.posts p on p.id = j.post_id
 join public.profiles o on o.id = case when j.provider_id = p_user then j.customer_id else j.provider_id end
 where j.status = 'confirmed' and (j.provider_id = p_user or j.customer_id = p_user)
   and (select record_public from public.profiles where id = p_user)
 order by j.confirmed_at desc limit 50
$$;
grant execute on function public.work_record(uuid) to anon, authenticated;

-- 2. Endorsements: after a confirmed job the customer ticks up to three of the provider's skills.
create table public.endorsements (
 job_id uuid not null references public.project_jobs(id) on delete cascade,
 from_user uuid not null references public.profiles(id) on delete cascade,
 to_user uuid not null references public.profiles(id) on delete cascade,
 skill text not null check (length(skill) between 1 and 60),
 created_at timestamptz not null default now(),
 primary key (job_id, skill)
);
create index endorsements_to_user_idx on public.endorsements(to_user);
alter table public.endorsements enable row level security;
create policy endorsements_read on public.endorsements for select to anon, authenticated using (true);

create function public.endorse(p_job uuid, p_skills text[]) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); j record; s text; n integer := 0;
begin
 select * into j from public.project_jobs where id = p_job;
 if j.id is null or j.customer_id <> v_me then raise exception 'not allowed' using errcode = '42501'; end if;
 if j.status <> 'confirmed' then raise exception 'job is not confirmed' using errcode = 'check_violation'; end if;
 foreach s in array coalesce(p_skills, '{}'::text[]) loop
  exit when n >= 3;
  -- Only skills the provider lists on their profile.
  if exists (select 1 from public.profile_skills ps join public.skills k on k.id = ps.skill_id where ps.profile_id = j.provider_id and k.name = s) then
   insert into public.endorsements(job_id, from_user, to_user, skill) values (p_job, v_me, j.provider_id, s) on conflict do nothing;
   n := n + 1;
  end if;
 end loop;
end;$$;
revoke execute on function public.endorse(uuid, text[]) from public, anon;
grant execute on function public.endorse(uuid, text[]) to authenticated;

commit;
