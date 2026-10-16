-- Piron Work | migration 0055 | Home in three pages, step 4: Book (request, accept, suggest another price or time, decline, expire)
-- A booking is a front door to the normal job: when it is agreed, a private project, an accepted quote and a job are
-- created, so delivery, confirmation, reviews, invoices, disputes and reminders all work as today. No money moves.
begin;

create table public.booking_requests (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references public.profiles(id) on delete cascade,
 provider_id uuid not null references public.profiles(id) on delete cascade,
 details text not null check (char_length(details) between 3 and 1000),
 place text check (place is null or char_length(place) <= 120),
 requested_start timestamptz,
 budget numeric(12, 2) check (budget is null or (budget >= 0 and budget < 100000)),
 status text not null default 'requested' check (status in ('requested', 'countered', 'accepted', 'declined', 'cancelled', 'expired')),
 counter_price numeric(12, 2) check (counter_price is null or (counter_price >= 0 and counter_price < 100000)),
 counter_start timestamptz,
 agreed_price numeric(12, 2),
 agreed_start timestamptz,
 decline_reason text check (decline_reason is null or char_length(decline_reason) <= 200),
 post_id uuid references public.posts(id) on delete set null,
 job_id uuid references public.project_jobs(id) on delete set null,
 expires_at timestamptz not null default now() + interval '48 hours',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (customer_id <> provider_id)
);
create index booking_requests_customer_idx on public.booking_requests (customer_id, created_at desc);
create index booking_requests_provider_idx on public.booking_requests (provider_id, created_at desc);
create index booking_requests_open_idx on public.booking_requests (expires_at) where status in ('requested', 'countered');
create trigger booking_requests_updated before update on public.booking_requests for each row execute function public.touch_updated_at();
alter table public.booking_requests enable row level security;
revoke all on public.booking_requests from anon, authenticated;
grant select on public.booking_requests to authenticated;
create policy booking_requests_read on public.booking_requests for select to authenticated
 using (customer_id = (select auth.uid()) or provider_id = (select auth.uid()) or public.is_admin());

-- Internal: turns an agreed booking into the normal job. Not callable by app roles.
create function public.booking_make_job(p_id uuid, p_price numeric, p_start timestamptz) returns uuid
language plpgsql security definer set search_path = '' as $$
declare b public.booking_requests; v_post uuid; v_quote uuid; v_job uuid; v_cat bigint;
begin
 select * into b from public.booking_requests where id = p_id for update;
 select primary_category_id into v_cat from public.profiles where id = b.provider_id;
 perform set_config('piron.booking', '1', true);   -- tells the quote notification to stay quiet
 insert into public.posts(author_id, kind, title, body, category_id, place, status, opens_at, budget_max)
  values (b.customer_id, 'need_help', left('Booking: ' || b.details, 120),
          'Booked from the Professionals page. ' || b.details || coalesce(E'\nPlace: ' || b.place, '') || coalesce(E'\nWhen: ' || to_char(p_start at time zone 'Asia/Phnom_Penh', 'YYYY-MM-DD HH24:MI'), ''),
          v_cat, b.place, 'published', 'infinity', p_price)
  returning id into v_post;
 update public.posts set invited_provider_id = b.provider_id where id = v_post;   -- after insert: no invitation notice
 insert into public.quotes(post_id, provider_id, price, currency, status, note)
  values (v_post, b.provider_id, p_price, 'USD', 'accepted', 'Agreed through a booking')
  returning id into v_quote;
 insert into public.project_jobs(post_id, quote_id, customer_id, provider_id, agreed_price, currency)
  values (v_post, v_quote, b.customer_id, b.provider_id, p_price, 'USD') returning id into v_job;
 update public.booking_requests set status = 'accepted', agreed_price = p_price, agreed_start = p_start, post_id = v_post, job_id = v_job where id = p_id;
 return v_post;
end;$$;
revoke execute on function public.booking_make_job(uuid, numeric, timestamptz) from public, anon, authenticated;

create function public.request_booking(p_provider uuid, p_details text, p_start timestamptz, p_place text, p_budget numeric) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); v_id uuid; v_ok boolean;
begin
 if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if me = p_provider then raise exception 'you cannot book yourself'; end if;
 if exists (select 1 from public.profiles where id = me and paused_at is not null) then raise exception 'account paused' using errcode = '42501'; end if;
 select is_available and paused_at is null into v_ok from public.profiles where id = p_provider;
 if not coalesce(v_ok, false) then raise exception 'this person is not taking bookings'; end if;
 if public.blocked_between(me, p_provider) then raise exception 'not allowed' using errcode = '42501'; end if;
 if coalesce(char_length(trim(p_details)), 0) < 3 then raise exception 'say what you need'; end if;
 if (select count(*) from public.booking_requests where customer_id = me and created_at > now() - interval '1 day') >= 5 then
  raise exception 'too many requests today, try again tomorrow';
 end if;
 if exists (select 1 from public.booking_requests where customer_id = me and provider_id = p_provider and status in ('requested', 'countered')) then
  raise exception 'you already have an open request with this person';
 end if;
 insert into public.booking_requests(customer_id, provider_id, details, place, requested_start, budget)
  values (me, p_provider, left(trim(p_details), 1000), nullif(left(trim(coalesce(p_place, '')), 120), ''), p_start, p_budget)
  returning id into v_id;
 perform public.notify(p_provider, 'Booking request', left(trim(p_details), 100), '/app/bookings');
 return v_id;
end;$$;

-- The provider answers a new request: accept, suggest another price or time, or decline.
create function public.answer_booking(p_id uuid, p_action text, p_price numeric, p_start timestamptz, p_reason text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); b public.booking_requests; v_price numeric; v_start timestamptz; v_post uuid;
begin
 select * into b from public.booking_requests where id = p_id for update;
 if b.id is null or b.provider_id <> me then raise exception 'not allowed' using errcode = '42501'; end if;
 if b.status <> 'requested' then raise exception 'this request is already %', b.status; end if;
 if b.expires_at < now() then
  update public.booking_requests set status = 'expired' where id = p_id;
  raise exception 'this request has expired';
 end if;
 if p_action = 'accept' then
  v_price := coalesce(p_price, b.budget);
  if v_price is null then raise exception 'enter the price you will charge'; end if;
  v_start := coalesce(p_start, b.requested_start);
  v_post := public.booking_make_job(p_id, v_price, v_start);
  perform public.notify(b.customer_id, 'Booking accepted', left(b.details, 100), '/app/post/' || v_post);
  return v_post;
 elsif p_action = 'counter' then
  if p_price is null and p_start is null then raise exception 'suggest a price or a time'; end if;
  update public.booking_requests set status = 'countered', counter_price = p_price, counter_start = p_start, expires_at = now() + interval '48 hours' where id = p_id;
  perform public.notify(b.customer_id, 'Booking changed', left(b.details, 100), '/app/bookings');
  return null;
 elsif p_action = 'decline' then
  update public.booking_requests set status = 'declined', decline_reason = nullif(left(trim(coalesce(p_reason, '')), 200), '') where id = p_id;
  perform public.notify(b.customer_id, 'Booking declined', left(b.details, 100), '/app/bookings');
  return null;
 end if;
 raise exception 'unknown action';
end;$$;

-- The customer answers the provider's suggestion.
create function public.answer_counter(p_id uuid, p_accept boolean) returns uuid language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); b public.booking_requests; v_post uuid; v_price numeric;
begin
 select * into b from public.booking_requests where id = p_id for update;
 if b.id is null or b.customer_id <> me then raise exception 'not allowed' using errcode = '42501'; end if;
 if b.status <> 'countered' then raise exception 'there is nothing to answer'; end if;
 if b.expires_at < now() then
  update public.booking_requests set status = 'expired' where id = p_id;
  raise exception 'this suggestion has expired';
 end if;
 if p_accept then
  v_price := coalesce(b.counter_price, b.budget);
  if v_price is null then raise exception 'no price to agree on'; end if;
  v_post := public.booking_make_job(p_id, v_price, coalesce(b.counter_start, b.requested_start));
  perform public.notify(b.provider_id, 'Booking accepted', left(b.details, 100), '/app/post/' || v_post);
  return v_post;
 end if;
 update public.booking_requests set status = 'declined', decline_reason = 'The customer did not accept the change' where id = p_id;
 perform public.notify(b.provider_id, 'Booking declined', left(b.details, 100), '/app/bookings');
 return null;
end;$$;

-- The customer withdraws a request that is still open.
create function public.cancel_booking(p_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); b public.booking_requests;
begin
 select * into b from public.booking_requests where id = p_id for update;
 if b.id is null or b.customer_id <> me then raise exception 'not allowed' using errcode = '42501'; end if;
 if b.status not in ('requested', 'countered') then raise exception 'this request is already %', b.status; end if;
 update public.booking_requests set status = 'cancelled' where id = p_id;
 perform public.notify(b.provider_id, 'Booking cancelled', left(b.details, 100), '/app/bookings');
end;$$;

-- Run every 30 minutes by cron: requests nobody answered for 48 hours are closed and the customer is told.
create function public.expire_bookings() returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
 for r in select id, customer_id, details from public.booking_requests where status in ('requested', 'countered') and expires_at < now() loop
  update public.booking_requests set status = 'expired' where id = r.id;
  perform public.notify(r.customer_id, 'Booking expired', left(r.details, 100), '/app/bookings');
  n := n + 1;
 end loop;
 return n;
end;$$;
revoke execute on function public.expire_bookings() from public, anon, authenticated;

revoke execute on function public.request_booking(uuid, text, timestamptz, text, numeric) from public, anon;
revoke execute on function public.answer_booking(uuid, text, numeric, timestamptz, text) from public, anon;
revoke execute on function public.answer_counter(uuid, boolean) from public, anon;
revoke execute on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.request_booking(uuid, text, timestamptz, text, numeric) to authenticated;
grant execute on function public.answer_booking(uuid, text, numeric, timestamptz, text) to authenticated;
grant execute on function public.answer_counter(uuid, boolean) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;

select cron.schedule('piron-expire-bookings', '*/30 * * * *', 'select public.expire_bookings()');

commit;
