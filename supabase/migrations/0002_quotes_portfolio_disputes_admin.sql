-- Piron Talent | migration 0002 | quotes, portfolio items, disputes, admin role, Khmer names
-- Run after 0001_init.sql in the Supabase SQL editor.
-- Rules kept from 0001: RLS on, default deny, explicit allow-list policies, and every status change
-- (accept, decline, resolve ...) happens in trusted server code, never from the browser.
begin;

-- 1. Khmer names on the taxonomy. English stays the key; Khmer is shown first in the UI.
alter table public.categories add column name_km text;
alter table public.skills add column name_km text;

update public.categories set name_km = v.name_km
from (values
 ('finance',     'ហិរញ្ញវត្ថុ និងគណនេយ្យ'),
 ('documents',   'ឯកសារ និងរដ្ឋបាល'),
 ('legal',       'សេវាកម្មច្បាប់'),
 ('tax',         'សេវាកម្មពន្ធដារ'),
 ('audit',       'សវនកម្ម និងការធានា'),
 ('technology',  'ព័ត៌មានវិទ្យា និងបច្ចេកវិទ្យា'),
 ('creative',    'ច្នៃប្រឌិត និងទីផ្សារ'),
 ('electrical',  'សេវាកម្មអគ្គិសនី'),
 ('maintenance', 'ថែទាំ និងជួសជុល'),
 ('beauty',      'សម្ផស្ស និងការថែរក្សាខ្លួន'),
 ('staffing',    'បុគ្គលិកបណ្តោះអាសន្ន'),
 ('education',   'អប់រំ និងបង្រៀនបន្ថែម'),
 ('logistics',   'ដឹកជញ្ជូន និងភស្តុភារកម្ម')
) as v(slug, name_km)
where public.categories.slug = v.slug;

-- 2. Admin role. A separate table, not a column on profiles, so a person editing their own profile
--    can never grant themselves admin. Rows are added only by the project owner in the SQL editor
--    (or by server code with the secret key); there is no client insert/update/delete policy.
create table public.admins (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 note text,
 created_at timestamptz not null default now()
);

-- "Am I an admin?" Runs with the caller's rights: the only row a person can read is their own.
create function public.is_admin() returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from public.admins where user_id=(select auth.uid()))
$$;

-- 3. Quotes: a provider's price for a post (need_help) or a job. Exactly one target.
create type public.quote_status as enum ('pending','accepted','declined','withdrawn');

create table public.quotes (
 id uuid primary key default gen_random_uuid(),
 post_id uuid references public.posts(id) on delete cascade,
 job_id uuid references public.jobs(id) on delete cascade,
 provider_id uuid not null references public.profiles(id),
 price numeric(12,2) not null check(price >= 0),
 currency text not null default 'USD',
 note text,
 status public.quote_status not null default 'pending',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((post_id is not null)::int + (job_id is not null)::int = 1)
);
-- One quote per provider per target, and at most one accepted quote per target.
create unique index quotes_post_provider_idx on public.quotes(post_id, provider_id) where post_id is not null;
create unique index quotes_job_provider_idx on public.quotes(job_id, provider_id) where job_id is not null;
create unique index quotes_post_accepted_idx on public.quotes(post_id) where post_id is not null and status='accepted';
create unique index quotes_job_accepted_idx on public.quotes(job_id) where job_id is not null and status='accepted';
create index quotes_provider_idx on public.quotes(provider_id, created_at desc);

-- The person who owns the post or job a quote answers.
create function public.quote_target_owner(p_post uuid, p_job uuid) returns uuid language sql stable set search_path='' as $$
 select coalesce(
  (select author_id from public.posts where id=p_post),
  (select poster_id from public.jobs where id=p_job))
$$;

-- Only a pending quote can change status; accepted, declined and withdrawn are final.
create function public.quote_status_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status <> old.status and old.status <> 'pending' then
  raise exception 'quote % is already %', old.id, old.status using errcode='check_violation';
 end if;
 if new.post_id is distinct from old.post_id or new.job_id is distinct from old.job_id or new.provider_id <> old.provider_id then
  raise exception 'quote target and provider cannot change' using errcode='check_violation';
 end if;
 return new;
end;$$;
create trigger quotes_status_guard before update on public.quotes for each row execute function public.quote_status_guard();
create trigger quotes_updated before update on public.quotes for each row execute function public.touch_updated_at();

-- 4. Portfolio items: a provider's past work, one image and a caption each.
create table public.portfolio_items (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid not null references public.profiles(id) on delete cascade,
 image_path text not null,            -- object path in the "portfolio" storage bucket: <provider_id>/<file>
 caption text check(caption is null or length(caption) <= 300),
 sort_order smallint not null default 0,
 created_at timestamptz not null default now()
);
create index portfolio_provider_idx on public.portfolio_items(provider_id, sort_order, created_at);

-- Public-read bucket for portfolio images. A provider may only write inside their own folder.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio','portfolio',true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy portfolio_images_read on storage.objects for select to anon, authenticated using (bucket_id='portfolio');
create policy portfolio_images_add on storage.objects for insert to authenticated
 with check (bucket_id='portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy portfolio_images_edit on storage.objects for update to authenticated
 using (bucket_id='portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy portfolio_images_delete on storage.objects for delete to authenticated
 using (bucket_id='portfolio' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- 5. Disputes: raised by either party of a booking or an accepted quote; worked by an admin.
create type public.dispute_status as enum ('open','reviewing','resolved','dismissed');

create table public.disputes (
 id uuid primary key default gen_random_uuid(),
 booking_id uuid references public.bookings(id),
 quote_id uuid references public.quotes(id),
 opened_by uuid not null references public.profiles(id),
 against_id uuid not null references public.profiles(id),
 reason text not null check(length(trim(reason)) > 0),
 status public.dispute_status not null default 'open',
 resolution text,
 resolved_by uuid references public.profiles(id),
 resolved_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check ((booking_id is not null)::int + (quote_id is not null)::int = 1),
 check (opened_by <> against_id)
);
create index disputes_open_idx on public.disputes(created_at desc) where status in ('open','reviewing');
create index disputes_party_idx on public.disputes(opened_by, created_at desc);

-- Is this person one of the two parties of the booking / quote being disputed?
create function public.is_dispute_party(p_booking uuid, p_quote uuid, p_user uuid) returns boolean language sql stable set search_path='' as $$
 select (p_booking is not null and exists(select 1 from public.bookings b where b.id=p_booking and p_user in (b.customer_id, b.provider_id)))
     or (p_quote is not null and exists(select 1 from public.quotes q where q.id=p_quote and q.status='accepted'
          and p_user in (q.provider_id, public.quote_target_owner(q.post_id, q.job_id))))
$$;

-- open -> reviewing -> resolved | dismissed (open may also go straight to resolved/dismissed). Final states stay.
create function public.dispute_status_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status <> old.status then
  if old.status in ('resolved','dismissed') then
   raise exception 'dispute % is already %', old.id, old.status using errcode='check_violation';
  end if;
  if new.status in ('resolved','dismissed') then
   new.resolved_at := coalesce(new.resolved_at, now());
  end if;
 end if;
 if new.booking_id is distinct from old.booking_id or new.quote_id is distinct from old.quote_id
    or new.opened_by <> old.opened_by or new.against_id <> old.against_id then
  raise exception 'dispute parties cannot change' using errcode='check_violation';
 end if;
 return new;
end;$$;
create trigger disputes_status_guard before update on public.disputes for each row execute function public.dispute_status_guard();
create trigger disputes_updated before update on public.disputes for each row execute function public.touch_updated_at();

-- 6. Row level security: default deny, then the allow-list.
alter table public.admins enable row level security;
alter table public.quotes enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.disputes enable row level security;

create policy admins_read_self on public.admins for select to authenticated using(user_id=(select auth.uid()));

-- Quotes: visible to the provider, the post/job owner, and admins. A provider may add a pending quote
-- on a published post/job that is not their own, and edit price/note while it is still pending.
-- Accept / decline / withdraw run server-side only (no client policy can change status).
create policy quotes_read on public.quotes for select to authenticated using(
 provider_id=(select auth.uid())
 or public.quote_target_owner(post_id, job_id)=(select auth.uid())
 or public.is_admin()
);
create policy quotes_add on public.quotes for insert to authenticated with check(
 provider_id=(select auth.uid()) and status='pending'
 and public.quote_target_owner(post_id, job_id) <> (select auth.uid())
 and ((post_id is not null and exists(select 1 from public.posts p where p.id=post_id and p.status='published' and p.kind='need_help'))
   or (job_id is not null and exists(select 1 from public.jobs j where j.id=job_id and j.status='published')))
);
create policy quotes_edit_pending on public.quotes for update to authenticated
 using(provider_id=(select auth.uid()) and status='pending')
 with check(provider_id=(select auth.uid()) and status='pending');

-- Portfolio: anyone signed in can look; only the owner adds, edits and removes their own items.
create policy portfolio_read on public.portfolio_items for select to authenticated using(true);
create policy portfolio_add on public.portfolio_items for insert to authenticated with check(provider_id=(select auth.uid()));
create policy portfolio_edit on public.portfolio_items for update to authenticated using(provider_id=(select auth.uid())) with check(provider_id=(select auth.uid()));
create policy portfolio_delete on public.portfolio_items for delete to authenticated using(provider_id=(select auth.uid()));

-- Disputes: the two parties and admins can read. A party may open one on a booking or accepted quote
-- they belong to. Review and resolution are server-side only.
create policy disputes_read on public.disputes for select to authenticated using(
 opened_by=(select auth.uid()) or against_id=(select auth.uid()) or public.is_admin()
);
create policy disputes_open on public.disputes for insert to authenticated with check(
 opened_by=(select auth.uid()) and status='open' and resolution is null and resolved_by is null and resolved_at is null
 and public.is_dispute_party(booking_id, quote_id, opened_by)
 and public.is_dispute_party(booking_id, quote_id, against_id)
);

-- Admins see everything they match and moderate, in read-only form from the browser.
create policy admin_read_profile_private on public.profile_private for select to authenticated using(public.is_admin());
create policy admin_read_posts on public.posts for select to authenticated using(public.is_admin());
create policy admin_read_jobs on public.jobs for select to authenticated using(public.is_admin());
create policy admin_read_services on public.services for select to authenticated using(public.is_admin());
create policy admin_read_bookings on public.bookings for select to authenticated using(public.is_admin());
create policy admin_read_applications on public.job_applications for select to authenticated using(public.is_admin());
create policy admin_read_verifications on public.professional_verifications for select to authenticated using(public.is_admin());
create policy admin_read_reports on public.reports for select to authenticated using(public.is_admin());
create policy admin_read_business_members on public.business_members for select to authenticated using(public.is_admin());

commit;

-- NOTES
-- 1. Make yourself admin after signing up once:  insert into public.admins(user_id, note)
--    select id, 'owner' from auth.users where email = 'pironbypor@gmail.com';
-- 2. State changes (quote accept/decline/withdraw, dispute review/resolve, booking status) go through
--    server actions that use the secret key and check the caller is a party or an admin. The triggers
--    above still refuse invalid transitions even for the secret key.
-- 3. Portfolio images live in the public "portfolio" bucket under <provider_id>/; max 5 MB, jpeg/png/webp.
