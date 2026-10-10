-- Piron Talent | migration 0003 | concierge pilot: intake forms and manual matching (business plan section 5, Q1)
-- The two landing-page forms write here without an account. The owner matches requests to providers and
-- records completed jobs by hand through the admin_* functions below. Default deny; admin_* check is_admin().
begin;

create type public.request_status as enum ('new','contacted','matched','completed','closed');
create type public.applicant_status as enum ('new','contacted','approved','rejected');
create type public.pilot_job_status as enum ('matched','in_progress','completed','cancelled');

-- "Post a project": what a business or household needs done.
create table public.project_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references public.profiles(id) on delete set null,
 contact_name text not null check(length(trim(contact_name)) between 1 and 120),
 contact text not null check(length(trim(contact)) between 3 and 120),
 business_name text check(business_name is null or length(business_name) <= 120),
 category_id bigint references public.categories(id),
 details text not null check(length(trim(details)) between 10 and 3000),
 budget_min numeric(12,2) check(budget_min is null or budget_min >= 0),
 budget_max numeric(12,2) check(budget_max is null or budget_max >= coalesce(budget_min,0)),
 needed_by text check(needed_by is null or length(needed_by) <= 120),
 locale text not null default 'km' check(locale in ('km','en')),
 status public.request_status not null default 'new',
 admin_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index project_requests_status_idx on public.project_requests(status, created_at desc);

-- "Join as a provider": a freelancer or professional offering their skills.
create table public.provider_applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references public.profiles(id) on delete set null,
 full_name text not null check(length(trim(full_name)) between 1 and 120),
 contact text not null check(length(trim(contact)) between 3 and 120),
 city text not null default 'Phnom Penh' check(length(city) <= 80),
 category_id bigint references public.categories(id),
 skills text not null check(length(trim(skills)) between 2 and 1000),
 experience_years numeric(4,1) check(experience_years is null or experience_years between 0 and 60),
 portfolio_url text check(portfolio_url is null or length(portfolio_url) <= 300),
 locale text not null default 'km' check(locale in ('km','en')),
 status public.applicant_status not null default 'new',
 admin_note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index provider_applications_status_idx on public.provider_applications(status, created_at desc);

-- A request matched to a provider by the owner, and later recorded as completed (the pilot's north-star count).
create table public.pilot_jobs (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.project_requests(id),
 application_id uuid not null references public.provider_applications(id),
 status public.pilot_job_status not null default 'matched',
 agreed_price numeric(12,2) check(agreed_price is null or agreed_price >= 0),
 currency text not null default 'USD',
 note text,
 completed_at timestamptz,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index pilot_jobs_request_idx on public.pilot_jobs(request_id);
create index pilot_jobs_status_idx on public.pilot_jobs(status, created_at desc);

create trigger project_requests_updated before update on public.project_requests for each row execute function public.touch_updated_at();
create trigger provider_applications_updated before update on public.provider_applications for each row execute function public.touch_updated_at();
create trigger pilot_jobs_updated before update on public.pilot_jobs for each row execute function public.touch_updated_at();

alter table public.project_requests enable row level security;
alter table public.provider_applications enable row level security;
alter table public.pilot_jobs enable row level security;

-- The forms work without an account; a signed-in person is linked to their own row and can read it back.
create policy requests_add on public.project_requests for insert to anon, authenticated
 with check(status='new' and admin_note is null and (user_id is null or user_id=(select auth.uid())));
create policy requests_read on public.project_requests for select to authenticated
 using(user_id=(select auth.uid()) or public.is_admin());
create policy applicants_add on public.provider_applications for insert to anon, authenticated
 with check(status='new' and admin_note is null and (user_id is null or user_id=(select auth.uid())));
create policy applicants_read on public.provider_applications for select to authenticated
 using(user_id=(select auth.uid()) or public.is_admin());
create policy pilot_jobs_read on public.pilot_jobs for select to authenticated using(public.is_admin());

-- Categories appear on the public landing page and in both forms.
create policy categories_read_public on public.categories for select to anon using(active);

-- Admin actions. Security definer so that no client policy can change a status; every one checks is_admin() first,
-- and only signed-in users may call them at all.
create function public.assert_admin() returns void language plpgsql stable set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'admin only' using errcode='42501'; end if;
end;$$;

create function public.admin_set_request(p_id uuid, p_status public.request_status, p_note text)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.assert_admin();
 update public.project_requests set status=p_status, admin_note=coalesce(p_note, admin_note) where id=p_id;
 if not found then raise exception 'request not found' using errcode='no_data_found'; end if;
end;$$;

create function public.admin_set_application(p_id uuid, p_status public.applicant_status, p_note text)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.assert_admin();
 update public.provider_applications set status=p_status, admin_note=coalesce(p_note, admin_note) where id=p_id;
 if not found then raise exception 'application not found' using errcode='no_data_found'; end if;
end;$$;

-- Match a request with a provider: creates the job, marks the request matched and the provider approved.
create function public.admin_match(p_request uuid, p_application uuid, p_price numeric, p_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_job uuid;
begin
 perform public.assert_admin();
 insert into public.pilot_jobs(request_id, application_id, agreed_price, note, created_by)
 values (p_request, p_application, p_price, p_note, (select auth.uid())) returning id into v_job;
 update public.project_requests set status='matched' where id=p_request and status in ('new','contacted');
 update public.provider_applications set status='approved' where id=p_application and status in ('new','contacted');
 return v_job;
end;$$;

-- Move a job on (in_progress, completed, cancelled). Completing a job also completes its request.
create function public.admin_set_job(p_job uuid, p_status public.pilot_job_status, p_price numeric, p_note text)
returns void language plpgsql security definer set search_path='' as $$
declare v_request uuid;
begin
 perform public.assert_admin();
 update public.pilot_jobs
  set status=p_status, agreed_price=coalesce(p_price, agreed_price), note=coalesce(p_note, note),
      completed_at=case when p_status='completed' then coalesce(completed_at, now()) else completed_at end
  where id=p_job returning request_id into v_request;
 if v_request is null then raise exception 'job not found' using errcode='no_data_found'; end if;
 if p_status='completed' then update public.project_requests set status='completed' where id=v_request; end if;
end;$$;

revoke execute on function public.assert_admin() from public, anon;
revoke execute on function public.admin_set_request(uuid, public.request_status, text) from public, anon;
revoke execute on function public.admin_set_application(uuid, public.applicant_status, text) from public, anon;
revoke execute on function public.admin_match(uuid, uuid, numeric, text) from public, anon;
revoke execute on function public.admin_set_job(uuid, public.pilot_job_status, numeric, text) from public, anon;
grant execute on function public.assert_admin() to authenticated;
grant execute on function public.admin_set_request(uuid, public.request_status, text) to authenticated;
grant execute on function public.admin_set_application(uuid, public.applicant_status, text) to authenticated;
grant execute on function public.admin_match(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.admin_set_job(uuid, public.pilot_job_status, numeric, text) to authenticated;

commit;

-- NOTES
-- 1. The forms accept anonymous inserts. The app adds a honeypot field and server-side validation; add Cloudflare
--    rate limiting on /post-project and /join before any paid promotion.
-- 2. Make yourself admin after your first sign-up (see 0002 notes), then /admin shows the lists.
