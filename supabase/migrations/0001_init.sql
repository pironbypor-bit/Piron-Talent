-- Piron Talent | Supabase PostgreSQL schema | v1.0
-- Execute in a NEW Supabase project's SQL editor. Review before production use.
-- This is a marketplace data model, not an escrow or payment processor.
begin;
create extension if not exists pgcrypto;

create type public.post_kind as enum ('need_help','offer_skill','hire_shift','share_knowledge');
create type public.listing_status as enum ('draft','published','paused','closed');
create type public.booking_status as enum ('requested','accepted','declined','cancelled','completed','disputed');
create type public.application_status as enum ('submitted','shortlisted','accepted','rejected','withdrawn');
create type public.verification_status as enum ('unverified','pending','verified','rejected');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'New member',
 username text unique,
 avatar_url text,
 bio text,
 city text,
 country text not null default 'Cambodia',
 is_available boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint username_format check (username is null or username ~ '^[a-z0-9_]{3,30}$')
);
create table public.profile_private (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 phone text, address text, date_of_birth date, updated_at timestamptz not null default now()
);
create table public.categories (
 id bigint generated always as identity primary key,
 slug text not null unique, name text not null, parent_id bigint references public.categories(id),
 requires_professional_review boolean not null default false,
 active boolean not null default true
);
create table public.skills (
 id bigint generated always as identity primary key,
 category_id bigint references public.categories(id), name text not null unique
);
create table public.profile_skills (
 profile_id uuid not null references public.profiles(id) on delete cascade,
 skill_id bigint not null references public.skills(id) on delete cascade,
 experience_years numeric(4,1) check (experience_years >= 0),
 primary key(profile_id,skill_id)
);
create table public.businesses (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
 name text not null, description text, city text, contact_email text,
 created_at timestamptz not null default now()
);
create table public.business_members (
 business_id uuid not null references public.businesses(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role text not null check(role in ('owner','manager','member')),
 primary key(business_id,user_id)
);
create table public.professional_verifications (
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.profiles(id),
 category_id bigint not null references public.categories(id),
 status public.verification_status not null default 'pending',
 credential_type text, credential_reference text, reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 unique(provider_id,category_id)
);
create table public.posts (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id),
 business_id uuid references public.businesses(id), kind public.post_kind not null,
 category_id bigint references public.categories(id), title text not null, body text not null,
 city text, budget_min numeric(12,2), budget_max numeric(12,2), currency text not null default 'USD',
 status public.listing_status not null default 'published', created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (budget_min is null or budget_min >= 0),
 check (budget_max is null or budget_max >= coalesce(budget_min,0))
);
create table public.post_comments (
 id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade,
 author_id uuid not null references public.profiles(id), parent_id uuid references public.post_comments(id),
 body text not null check(length(trim(body)) > 0), created_at timestamptz not null default now()
);
create table public.post_reactions (
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 reaction text not null default 'cheer' check(reaction in ('cheer','support','inspired')),
 created_at timestamptz not null default now(), primary key(post_id,user_id)
);
create table public.saved_posts (
 user_id uuid not null references public.profiles(id) on delete cascade,
 post_id uuid not null references public.posts(id) on delete cascade,
 created_at timestamptz not null default now(),primary key(user_id,post_id)
);
create table public.follows (
 follower_id uuid not null references public.profiles(id) on delete cascade,
 followed_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(follower_id,followed_id),check(follower_id <> followed_id)
);
create table public.services (
 id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.profiles(id),
 category_id bigint not null references public.categories(id), title text not null, description text,
 price_from numeric(12,2) not null check(price_from >= 0), currency text not null default 'USD',
 pricing_unit text not null default 'project' check(pricing_unit in ('hour','day','session','project')),
 city text, remote_available boolean not null default false,
 status public.listing_status not null default 'draft', created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.service_availability (
 id uuid primary key default gen_random_uuid(), service_id uuid not null references public.services(id) on delete cascade,
 weekday smallint not null check(weekday between 0 and 6),
 start_time time not null, end_time time not null, check(start_time < end_time)
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(), service_id uuid not null references public.services(id),
 customer_id uuid not null references public.profiles(id), provider_id uuid not null references public.profiles(id),
 requested_start timestamptz, details text, agreed_price numeric(12,2) check(agreed_price >= 0),
 currency text not null default 'USD', status public.booking_status not null default 'requested',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(customer_id <> provider_id)
);
create table public.jobs (
 id uuid primary key default gen_random_uuid(), poster_id uuid not null references public.profiles(id),
 business_id uuid references public.businesses(id), category_id bigint references public.categories(id),
 title text not null, description text not null, city text, remote_available boolean not null default false,
 worker_count integer not null default 1 check(worker_count between 1 and 1000),
 pay_amount numeric(12,2) check(pay_amount >= 0), currency text not null default 'USD',
 pay_unit text not null default 'shift' check(pay_unit in ('hour','day','shift','project')),
 starts_at timestamptz, ends_at timestamptz, status public.listing_status not null default 'draft',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(ends_at is null or starts_at is null or ends_at > starts_at)
);
create table public.job_applications (
 id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
 applicant_id uuid not null references public.profiles(id), cover_note text,
 status public.application_status not null default 'submitted',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(job_id,applicant_id)
);
create table public.conversations (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now()
);
create table public.conversation_members (
 conversation_id uuid not null references public.conversations(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 joined_at timestamptz not null default now(), primary key(conversation_id,user_id)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
 sender_id uuid not null references public.profiles(id), body text not null,
 created_at timestamptz not null default now(), check(length(trim(body)) > 0)
);
create table public.reviews (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null references public.bookings(id),
 author_id uuid not null references public.profiles(id), subject_id uuid not null references public.profiles(id),
 stars smallint not null check(stars between 1 and 5), comment text,
 created_at timestamptz not null default now(), unique(booking_id,author_id),
 check(author_id <> subject_id)
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 title text not null, body text, link_path text, read_at timestamptz,
 created_at timestamptz not null default now()
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id),
 target_type text not null check(target_type in ('post','comment','user','service','job','message')),
 target_id uuid not null, reason text not null, status text not null default 'open'
 check(status in ('open','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now()
);
create table public.plans (
 id bigint generated always as identity primary key, code text not null unique,
 name text not null, monthly_price numeric(12,2) not null check(monthly_price >= 0),
 currency text not null default 'USD', active boolean not null default true
);
create table public.business_subscriptions (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id),
 plan_id bigint not null references public.plans(id),
 status text not null default 'trialing' check(status in ('trialing','active','past_due','cancelled')),
 current_period_start timestamptz, current_period_end timestamptz,
 external_subscription_id text, created_at timestamptz not null default now()
);
create table public.payment_records (
 id uuid primary key default gen_random_uuid(), booking_id uuid references public.bookings(id),
 business_subscription_id uuid references public.business_subscriptions(id),
 provider text, external_payment_id text unique, gross_amount numeric(12,2) not null check(gross_amount >= 0),
 platform_fee numeric(12,2) not null default 0 check(platform_fee >= 0),
 currency text not null default 'USD', status text not null default 'pending'
 check(status in ('pending','confirmed','failed','refunded')),
 created_at timestamptz not null default now(),
 check ((booking_id is not null)::int + (business_subscription_id is not null)::int = 1)
);

create index posts_recent_idx on public.posts(created_at desc) where status='published';
create index posts_category_idx on public.posts(category_id,created_at desc);
create index comments_post_idx on public.post_comments(post_id,created_at);
create index services_category_idx on public.services(category_id,status);
create index jobs_recent_idx on public.jobs(created_at desc) where status='published';
create index applications_job_idx on public.job_applications(job_id);
create index bookings_customer_idx on public.bookings(customer_id,created_at desc);
create index bookings_provider_idx on public.bookings(provider_id,created_at desc);
create index messages_conversation_idx on public.messages(conversation_id,created_at desc);
create index notifications_user_idx on public.notifications(user_id,created_at desc);

create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now();return new;end;$$;
create function public.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,display_name)
values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'New member'));
return new;end;$$;
create trigger auth_create_profile after insert on auth.users for each row execute function public.new_profile();
create trigger profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
create trigger posts_updated before update on public.posts for each row execute function public.touch_updated_at();
create trigger services_updated before update on public.services for each row execute function public.touch_updated_at();
create trigger bookings_updated before update on public.bookings for each row execute function public.touch_updated_at();
create trigger jobs_updated before update on public.jobs for each row execute function public.touch_updated_at();
create trigger applications_updated before update on public.job_applications for each row execute function public.touch_updated_at();

-- Helpers use caller privileges, with no untrusted dynamic SQL.
create function public.is_business_member(b uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from public.business_members where business_id=b and user_id=(select auth.uid()))
$$;
create function public.is_conversation_member(c uuid) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from public.conversation_members where conversation_id=c and user_id=(select auth.uid()))
$$;

-- Default deny. Explicit allow-list policies only.
do $$ declare t text; begin
 foreach t in array array['profiles','profile_private','categories','skills','profile_skills','businesses','business_members','professional_verifications','posts','post_comments','post_reactions','saved_posts','follows','services','service_availability','bookings','jobs','job_applications','conversations','conversation_members','messages','reviews','notifications','reports','plans','business_subscriptions','payment_records'] loop
 execute format('alter table public.%I enable row level security',t);
 end loop; end $$;

create policy profiles_read on public.profiles for select to authenticated using(true);
create policy profiles_edit on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy private_own on public.profile_private for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy categories_read on public.categories for select to authenticated using(active);
create policy skills_read on public.skills for select to authenticated using(true);
create policy profile_skills_read on public.profile_skills for select to authenticated using(true);
create policy profile_skills_insert on public.profile_skills for insert to authenticated with check(profile_id=(select auth.uid()));
create policy profile_skills_delete on public.profile_skills for delete to authenticated using(profile_id=(select auth.uid()));
create policy businesses_read on public.businesses for select to authenticated using(true);
create policy businesses_create on public.businesses for insert to authenticated with check(owner_id=(select auth.uid()));
create policy businesses_edit on public.businesses for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy businesses_members_read on public.business_members for select to authenticated using(user_id=(select auth.uid()));
-- Manage business memberships and professional verification only with trusted server code.
create policy verify_self_read on public.professional_verifications for select to authenticated using(provider_id=(select auth.uid()));
create policy posts_read on public.posts for select to authenticated using(status='published' or author_id=(select auth.uid()));
create policy posts_create on public.posts for insert to authenticated with check(author_id=(select auth.uid()) and (business_id is null or public.is_business_member(business_id)));
create policy posts_edit on public.posts for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()) and (business_id is null or public.is_business_member(business_id)));
create policy posts_delete on public.posts for delete to authenticated using(author_id=(select auth.uid()));
create policy comments_read on public.post_comments for select to authenticated using(exists(select 1 from public.posts p where p.id=post_id and (p.status='published' or p.author_id=(select auth.uid()))));
create policy comments_add on public.post_comments for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.posts p where p.id=post_id and p.status='published'));
create policy comments_delete on public.post_comments for delete to authenticated using(author_id=(select auth.uid()));
create policy reactions_read on public.post_reactions for select to authenticated using(true);
create policy reactions_add on public.post_reactions for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.posts p where p.id=post_id and p.status='published'));
create policy reactions_delete on public.post_reactions for delete to authenticated using(user_id=(select auth.uid()));
create policy saved_own on public.saved_posts for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy follows_read on public.follows for select to authenticated using(true);
create policy follows_add on public.follows for insert to authenticated with check(follower_id=(select auth.uid()));
create policy follows_delete on public.follows for delete to authenticated using(follower_id=(select auth.uid()));
create policy services_read on public.services for select to authenticated using(status='published' or provider_id=(select auth.uid()));
create policy services_create on public.services for insert to authenticated with check(provider_id=(select auth.uid()) and status='draft');
create policy services_edit on public.services for update to authenticated using(provider_id=(select auth.uid())) with check(provider_id=(select auth.uid()) and status in ('draft','paused','closed'));
create policy services_delete on public.services for delete to authenticated using(provider_id=(select auth.uid()));
create policy availability_read on public.service_availability for select to authenticated using(exists(select 1 from public.services s where s.id=service_id and(s.status='published' or s.provider_id=(select auth.uid()))));
create policy availability_add on public.service_availability for insert to authenticated with check(exists(select 1 from public.services s where s.id=service_id and s.provider_id=(select auth.uid())));
create policy availability_delete on public.service_availability for delete to authenticated using(exists(select 1 from public.services s where s.id=service_id and s.provider_id=(select auth.uid())));
create policy bookings_read on public.bookings for select to authenticated using(customer_id=(select auth.uid()) or provider_id=(select auth.uid()));
-- Booking provider_id must be derived from service owner by trusted backend; no direct client writes.
create policy jobs_read on public.jobs for select to authenticated using(status='published' or poster_id=(select auth.uid()));
create policy jobs_create on public.jobs for insert to authenticated with check(poster_id=(select auth.uid()) and status='draft' and (business_id is null or public.is_business_member(business_id)));
create policy jobs_edit on public.jobs for update to authenticated using(poster_id=(select auth.uid())) with check(poster_id=(select auth.uid()) and status in ('draft','paused','closed'));
create policy jobs_delete on public.jobs for delete to authenticated using(poster_id=(select auth.uid()));
create policy applications_read on public.job_applications for select to authenticated using(applicant_id=(select auth.uid()) or exists(select 1 from public.jobs j where j.id=job_id and j.poster_id=(select auth.uid())));
create policy applications_add on public.job_applications for insert to authenticated with check(applicant_id=(select auth.uid()) and exists(select 1 from public.jobs j where j.id=job_id and j.status='published' and j.poster_id<>(select auth.uid())));
-- Application status changes should be handled by server functions to enforce state transitions.
create policy conversations_read on public.conversations for select to authenticated using(public.is_conversation_member(id));
create policy members_read on public.conversation_members for select to authenticated using(public.is_conversation_member(conversation_id));
create policy messages_read on public.messages for select to authenticated using(public.is_conversation_member(conversation_id));
create policy messages_send on public.messages for insert to authenticated with check(sender_id=(select auth.uid()) and public.is_conversation_member(conversation_id));
create policy reviews_read on public.reviews for select to authenticated using(true);
-- Reviews must be submitted via server after confirming completed transaction + participant identity.
create policy notifications_read on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy notifications_mark_read on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy reports_add on public.reports for insert to authenticated with check(reporter_id=(select auth.uid()) and status='open');
create policy reports_read_own on public.reports for select to authenticated using(reporter_id=(select auth.uid()));
create policy plans_read on public.plans for select to authenticated using(active);
create policy subscriptions_read on public.business_subscriptions for select to authenticated using(public.is_business_member(business_id));
create policy payments_read on public.payment_records for select to authenticated using(
 (booking_id is not null and exists(select 1 from public.bookings b where b.id=booking_id and (b.customer_id=(select auth.uid()) or b.provider_id=(select auth.uid()))))
 or (business_subscription_id is not null and exists(select 1 from public.business_subscriptions s where s.id=business_subscription_id and public.is_business_member(s.business_id)))
);

-- Seed only taxonomy / subscriptions, never fabricated verified professionals.
insert into public.categories(slug,name,requires_professional_review) values
('finance','Finance & Bookkeeping',false),('documents','Documents & Administration',false),
('legal','Legal Services',true),('tax','Tax Agency',true),('audit','Audit & Assurance',true),
('technology','IT & Technology',false),('creative','Creative & Marketing',false),
('electrical','Electrical Services',true),('maintenance','Maintenance & Repairs',false),
('beauty','Beauty & Personal Care',false),('staffing','Temporary Staffing',false),
('education','Education & Tutoring',false),('logistics','Delivery & Logistics',false);
insert into public.plans(code,name,monthly_price) values
('free','Free',0),('business','Business',19),('business_pro','Business Pro',49);
commit;

-- IMPLEMENTATION / SECURITY NOTES:
-- 1. Service publishing, professional verification and job publishing require
--    server-side authorization and checks. Client-facing RLS intentionally cannot publish drafts.
-- 2. Use Supabase Edge Functions with server-side service role only for verified
--    bookings, conversation creation/membership, state transitions, reviews,
--    subscriptions, and webhook-confirmed payment status updates.
-- 3. Never expose the service_role key or credential evidence in client code.
-- 4. Add CAPTCHA/rate limiting, abuse detection, attachment storage policies,
--    and retention/privacy controls before launch.
-- 5. Legal/tax/audit services may require Cambodian professional licensing checks.
-- 6. Payment records are bookkeeping only; use a properly licensed processor.
-- 7. Review and test policies, including role/status changes, with separate users.
