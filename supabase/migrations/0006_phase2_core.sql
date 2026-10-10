-- Piron Talent | migration 0006 | Phase 2 core loop: project scope, quotes, job record, reviews
-- Run after 0005. State changes only through the security-definer functions below; triggers write notifications.
begin;

-- 1. Project scope on Job offer posts; delivery days on quotes.
alter table public.posts
 add column deliverables text[] not null default '{}',
 add column deadline date,
 add column remote boolean not null default false;
alter table public.quotes add column days smallint check (days is null or days between 1 and 365);

-- 2. The job that an accepted quote becomes.
create type public.project_job_status as enum ('accepted','delivered','confirmed','cancelled');
create table public.project_jobs (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.posts(id),
 quote_id uuid not null unique references public.quotes(id),
 customer_id uuid not null references public.profiles(id),
 provider_id uuid not null references public.profiles(id),
 agreed_price numeric(12,2) not null check (agreed_price >= 0),
 currency text not null default 'USD',
 status public.project_job_status not null default 'accepted',
 delivered_at timestamptz,
 confirmed_at timestamptz,
 cancelled_by uuid references public.profiles(id),
 note text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (customer_id <> provider_id)
);
create unique index project_jobs_post_active_idx on public.project_jobs(post_id) where status in ('accepted','delivered','confirmed');
create index project_jobs_customer_idx on public.project_jobs(customer_id, created_at desc);
create index project_jobs_provider_idx on public.project_jobs(provider_id, created_at desc);
create trigger project_jobs_updated before update on public.project_jobs for each row execute function public.touch_updated_at();
alter table public.project_jobs enable row level security;
create policy project_jobs_read on public.project_jobs for select to authenticated
 using (customer_id=(select auth.uid()) or provider_id=(select auth.uid()) or public.is_admin());

-- 3. Reviews can belong to a project job as well as a booking.
alter table public.reviews alter column booking_id drop not null;
alter table public.reviews add column project_job_id uuid references public.project_jobs(id);
alter table public.reviews add constraint reviews_one_target check ((booking_id is not null)::int + (project_job_id is not null)::int = 1);
create unique index reviews_job_author_idx on public.reviews(project_job_id, author_id) where project_job_id is not null;

-- 4. No new quotes once a project has an accepted quote.
drop policy quotes_add on public.quotes;
create policy quotes_add on public.quotes for insert to authenticated with check(
 provider_id=(select auth.uid()) and status='pending'
 and public.quote_target_owner(post_id, job_id) <> (select auth.uid())
 and ((post_id is not null and exists(select 1 from public.posts p where p.id=post_id and p.status='published' and p.kind='need_help')
       and not exists(select 1 from public.project_jobs j where j.post_id=post_id and j.status in ('accepted','delivered','confirmed')))
   or (job_id is not null and exists(select 1 from public.jobs j where j.id=job_id and j.status='published')))
);

-- 5. Helpers.
create function public.notify(p_user uuid, p_title text, p_body text, p_link text) returns void
language sql security definer set search_path='' as $$
 insert into public.notifications(user_id, title, body, link_path) values (p_user, p_title, left(p_body, 120), p_link)
$$;
revoke execute on function public.notify(uuid, text, text, text) from public, anon, authenticated;

/** How many live quotes a project has; visible to everyone without exposing prices. */
create function public.quote_count(p_post uuid) returns integer language sql stable security definer set search_path='' as $$
 select count(*)::int from public.quotes where post_id=p_post and status in ('pending','accepted')
$$;

create function public.notify_quote() returns trigger language plpgsql security definer set search_path='' as $$
declare v_author uuid; v_title text;
begin
 if new.post_id is null then return new; end if;
 select author_id, title into v_author, v_title from public.posts where id=new.post_id;
 perform public.notify(v_author, 'New quote', v_title, '/app/post/' || new.post_id);
 return new;
end;$$;
create trigger quotes_notify after insert on public.quotes for each row execute function public.notify_quote();

-- 6. Quote decisions. The post author accepts or declines; the provider withdraws. Accepting creates the job and
--    declines the other pending quotes.
create function public.accept_quote(p_quote uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); q record; v_job uuid;
begin
 select q1.id, q1.post_id, q1.provider_id, q1.price, q1.currency, q1.status, p.author_id, p.title
  into q from public.quotes q1 join public.posts p on p.id=q1.post_id where q1.id=p_quote;
 if q.id is null or q.author_id <> v_me then raise exception 'not allowed' using errcode='42501'; end if;
 if q.status <> 'pending' then raise exception 'quote is not pending' using errcode='check_violation'; end if;
 if exists(select 1 from public.project_jobs j where j.post_id=q.post_id and j.status in ('accepted','delivered','confirmed')) then
  raise exception 'this project already has an accepted quote' using errcode='check_violation';
 end if;
 update public.quotes set status='accepted' where id=p_quote;
 update public.quotes set status='declined' where post_id=q.post_id and id<>p_quote and status='pending';
 insert into public.project_jobs(post_id, quote_id, customer_id, provider_id, agreed_price, currency)
  values (q.post_id, p_quote, v_me, q.provider_id, q.price, q.currency) returning id into v_job;
 perform public.notify(q.provider_id, 'Quote accepted', q.title, '/app/post/' || q.post_id);
 return v_job;
end;$$;

create function public.decline_quote(p_quote uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); q record;
begin
 select q1.id, q1.post_id, q1.provider_id, q1.status, p.author_id, p.title
  into q from public.quotes q1 join public.posts p on p.id=q1.post_id where q1.id=p_quote;
 if q.id is null or q.author_id <> v_me then raise exception 'not allowed' using errcode='42501'; end if;
 if q.status <> 'pending' then raise exception 'quote is not pending' using errcode='check_violation'; end if;
 update public.quotes set status='declined' where id=p_quote;
 perform public.notify(q.provider_id, 'Quote declined', q.title, '/app/post/' || q.post_id);
end;$$;

create function public.withdraw_quote(p_quote uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid());
begin
 update public.quotes set status='withdrawn' where id=p_quote and provider_id=v_me and status='pending';
 if not found then raise exception 'not allowed' using errcode='42501'; end if;
end;$$;

-- 7. Job progress. Provider marks delivered; customer confirms; either side may cancel before delivery.
create function public.mark_delivered(p_job uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); j record;
begin
 select j1.*, p.title into j from public.project_jobs j1 join public.posts p on p.id=j1.post_id where j1.id=p_job;
 if j.id is null or j.provider_id <> v_me then raise exception 'not allowed' using errcode='42501'; end if;
 if j.status <> 'accepted' then raise exception 'job is not in progress' using errcode='check_violation'; end if;
 update public.project_jobs set status='delivered', delivered_at=now() where id=p_job;
 perform public.notify(j.customer_id, 'Work delivered', j.title, '/app/post/' || j.post_id);
end;$$;

create function public.confirm_completion(p_job uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); j record;
begin
 select j1.*, p.title into j from public.project_jobs j1 join public.posts p on p.id=j1.post_id where j1.id=p_job;
 if j.id is null or j.customer_id <> v_me then raise exception 'not allowed' using errcode='42501'; end if;
 if j.status <> 'delivered' then raise exception 'work is not delivered yet' using errcode='check_violation'; end if;
 update public.project_jobs set status='confirmed', confirmed_at=now() where id=p_job;
 update public.profiles set completed_jobs=completed_jobs+1 where id=j.provider_id;
 perform public.notify(j.provider_id, 'Job confirmed', j.title, '/app/post/' || j.post_id);
end;$$;

create function public.cancel_job(p_job uuid, p_note text) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); j record; v_other uuid;
begin
 select j1.*, p.title into j from public.project_jobs j1 join public.posts p on p.id=j1.post_id where j1.id=p_job;
 if j.id is null or (j.customer_id <> v_me and j.provider_id <> v_me) then raise exception 'not allowed' using errcode='42501'; end if;
 if j.status <> 'accepted' then raise exception 'only a job that is not delivered can be cancelled' using errcode='check_violation'; end if;
 update public.project_jobs set status='cancelled', cancelled_by=v_me, note=p_note where id=p_job;
 v_other := case when v_me = j.customer_id then j.provider_id else j.customer_id end;
 perform public.notify(v_other, 'Job cancelled', j.title, '/app/post/' || j.post_id);
end;$$;

-- 8. A review, by the customer, only after confirmation.
create function public.leave_review(p_job uuid, p_stars smallint, p_comment text) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); j record;
begin
 select j1.*, p.title into j from public.project_jobs j1 join public.posts p on p.id=j1.post_id where j1.id=p_job;
 if j.id is null or j.customer_id <> v_me then raise exception 'not allowed' using errcode='42501'; end if;
 if j.status <> 'confirmed' then raise exception 'job is not confirmed' using errcode='check_violation'; end if;
 if p_stars < 1 or p_stars > 5 then raise exception 'stars must be 1 to 5' using errcode='check_violation'; end if;
 insert into public.reviews(project_job_id, author_id, subject_id, stars, comment) values (p_job, v_me, j.provider_id, p_stars, nullif(trim(p_comment), ''));
 perform public.notify(j.provider_id, 'New review', j.title, '/app/providers/' || j.provider_id);
end;$$;

revoke execute on function public.accept_quote(uuid) from public, anon;
revoke execute on function public.decline_quote(uuid) from public, anon;
revoke execute on function public.withdraw_quote(uuid) from public, anon;
revoke execute on function public.mark_delivered(uuid) from public, anon;
revoke execute on function public.confirm_completion(uuid) from public, anon;
revoke execute on function public.cancel_job(uuid, text) from public, anon;
revoke execute on function public.leave_review(uuid, smallint, text) from public, anon;
grant execute on function public.accept_quote(uuid), public.decline_quote(uuid), public.withdraw_quote(uuid), public.mark_delivered(uuid),
 public.confirm_completion(uuid), public.cancel_job(uuid, text), public.leave_review(uuid, smallint, text) to authenticated;
grant execute on function public.quote_count(uuid) to anon, authenticated;

commit;
