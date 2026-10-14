-- Piron Work | migration 0025 | volunteer activities (people plan, 2026-10-14)
-- Run after 0024_invite_providers.sql in the Supabase SQL editor.
-- An activity has its own group chat (a conversation of kind 'group'); joining adds you, leaving removes you.
-- Hours count only when the organiser confirms them after the event.
begin;

create table public.activities (
 id uuid primary key default gen_random_uuid(),
 organiser_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check (length(title) between 3 and 120),
 description text not null check (length(description) between 10 and 3000),
 place text check (place is null or length(place) <= 120),
 city text check (city is null or length(city) <= 40),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 capacity integer not null check (capacity between 1 and 100),
 bring text check (bring is null or length(bring) <= 500),
 status text not null default 'open' check (status in ('open','cancelled')),
 conversation_id uuid references public.conversations(id) on delete set null,
 created_at timestamptz not null default now(),
 check (ends_at > starts_at and ends_at <= starts_at + interval '24 hours')
);
create index activities_start_idx on public.activities(starts_at) where status = 'open';

create table public.activity_members (
 activity_id uuid not null references public.activities(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'joined' check (status in ('joined','waitlist','confirmed','absent')),
 hours numeric(4,1) check (hours is null or hours between 0 and 24),
 joined_at timestamptz not null default now(),
 primary key (activity_id, user_id)
);
create index activity_members_user_idx on public.activity_members(user_id);

-- Helpers are security definer so the two tables' policies never read each other directly.
create function public.is_activity_organiser(p_activity uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.activities a where a.id = p_activity and a.organiser_id = (select auth.uid()))
$$;
create function public.is_activity_member(p_activity uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.activity_members m where m.activity_id = p_activity and m.user_id = (select auth.uid()))
$$;
grant execute on function public.is_activity_organiser(uuid), public.is_activity_member(uuid) to anon, authenticated;

alter table public.activities enable row level security;
alter table public.activity_members enable row level security;
create policy activities_read_public on public.activities for select to anon using (status = 'open');
create policy activities_read on public.activities for select to authenticated
 using (status = 'open' or organiser_id = (select auth.uid()) or public.is_activity_member(id));
create policy activity_members_read on public.activity_members for select to authenticated
 using (user_id = (select auth.uid()) or public.is_activity_organiser(activity_id));

-- Counts for lists: how many joined, how many wait, and my own status.
create function public.activity_stats(p_ids uuid[]) returns table(activity_id uuid, joined integer, waitlist integer, mine text)
language sql stable security definer set search_path='' as $$
 select a.id,
  (select count(*)::int from public.activity_members m where m.activity_id = a.id and m.status in ('joined','confirmed')),
  (select count(*)::int from public.activity_members m where m.activity_id = a.id and m.status = 'waitlist'),
  (select m.status from public.activity_members m where m.activity_id = a.id and m.user_id = (select auth.uid()))
 from public.activities a where a.id = any(p_ids)
$$;
grant execute on function public.activity_stats(uuid[]) to anon, authenticated;

-- The volunteer record on a profile. Hidden when the person turned their work record off.
create function public.volunteer_record(p_user uuid) returns table(activities integer, hours numeric)
language sql stable security definer set search_path='' as $$
 select count(*)::int, coalesce(sum(m.hours), 0)
 from public.activity_members m
 where m.user_id = p_user and m.status = 'confirmed'
   and (select record_public from public.profiles where id = p_user)
$$;
grant execute on function public.volunteer_record(uuid) to anon, authenticated;

create function public.create_activity(p_title text, p_description text, p_place text, p_city text, p_starts timestamptz, p_ends timestamptz, p_capacity integer, p_bring text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_id uuid := gen_random_uuid(); v_conv uuid;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if p_starts <= now() then raise exception 'start must be in the future' using errcode = 'check_violation'; end if;
 if (select count(*) from public.activities where organiser_id = v_me and status = 'open' and ends_at > now()) >= 5 then
  raise exception 'too many open activities' using errcode = 'check_violation';
 end if;
 insert into public.conversations(kind, title, created_by) values ('group', left(trim(p_title), 80), v_me) returning id into v_conv;
 insert into public.conversation_members(conversation_id, user_id, role) values (v_conv, v_me, 'owner');
 insert into public.activities(id, organiser_id, title, description, place, city, starts_at, ends_at, capacity, bring, conversation_id)
 values (v_id, v_me, trim(p_title), trim(p_description), nullif(trim(coalesce(p_place, '')), ''), nullif(trim(coalesce(p_city, '')), ''), p_starts, p_ends, p_capacity, nullif(trim(coalesce(p_bring, '')), ''), v_conv);
 return v_id;
end;$$;
revoke execute on function public.create_activity(text, text, text, text, timestamptz, timestamptz, integer, text) from public, anon;
grant execute on function public.create_activity(text, text, text, text, timestamptz, timestamptz, integer, text) to authenticated;

-- Join: a place if there is room, else the waitlist. Joined people are added to the activity chat.
create function public.join_activity(p_activity uuid) returns text language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); a record; v_status text; v_taken integer; v_name text;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 select * into a from public.activities where id = p_activity and status = 'open' for update;
 if a.id is null or a.ends_at <= now() then raise exception 'activity is closed' using errcode = 'check_violation'; end if;
 if a.organiser_id = v_me then raise exception 'you organise this activity' using errcode = 'check_violation'; end if;
 select m.status into v_status from public.activity_members m where m.activity_id = p_activity and m.user_id = v_me;
 if v_status is not null then return v_status; end if;
 select count(*) into v_taken from public.activity_members where activity_id = p_activity and status in ('joined','confirmed');
 v_status := case when v_taken < a.capacity then 'joined' else 'waitlist' end;
 insert into public.activity_members(activity_id, user_id, status) values (p_activity, v_me, v_status);
 if v_status = 'joined' and a.conversation_id is not null then
  insert into public.conversation_members(conversation_id, user_id) values (a.conversation_id, v_me) on conflict do nothing;
 end if;
 select display_name into v_name from public.profiles where id = v_me;
 perform public.notify(a.organiser_id, 'Activity joined', coalesce(v_name, '') || ' · ' || a.title, '/app/activities/' || p_activity);
 return v_status;
end;$$;
revoke execute on function public.join_activity(uuid) from public, anon;
grant execute on function public.join_activity(uuid) to authenticated;

-- Leave: free the place, take them out of the chat, and promote the first person on the waitlist.
create function public.leave_activity(p_activity uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); a record; v_was text; v_next uuid;
begin
 select * into a from public.activities where id = p_activity;
 select status into v_was from public.activity_members where activity_id = p_activity and user_id = v_me and status in ('joined','waitlist');
 if a.id is null or v_was is null then return; end if;
 delete from public.activity_members where activity_id = p_activity and user_id = v_me;
 if a.conversation_id is not null then
  delete from public.conversation_members where conversation_id = a.conversation_id and user_id = v_me and role = 'member';
 end if;
 if v_was = 'joined' then
  select user_id into v_next from public.activity_members where activity_id = p_activity and status = 'waitlist' order by joined_at limit 1;
  if v_next is not null then
   update public.activity_members set status = 'joined' where activity_id = p_activity and user_id = v_next;
   if a.conversation_id is not null then
    insert into public.conversation_members(conversation_id, user_id) values (a.conversation_id, v_next) on conflict do nothing;
   end if;
   perform public.notify(v_next, 'Activity spot', a.title, '/app/activities/' || p_activity);
  end if;
 end if;
end;$$;
revoke execute on function public.leave_activity(uuid) from public, anon;
grant execute on function public.leave_activity(uuid) to authenticated;

create function public.cancel_activity(p_activity uuid) returns void language plpgsql security definer set search_path='' as $$
declare a record; m record;
begin
 select * into a from public.activities where id = p_activity and organiser_id = (select auth.uid()) and status = 'open';
 if a.id is null then raise exception 'not allowed' using errcode = '42501'; end if;
 update public.activities set status = 'cancelled' where id = p_activity;
 for m in select user_id from public.activity_members where activity_id = p_activity loop
  perform public.notify(m.user_id, 'Activity cancelled', a.title, '/app/activities/' || p_activity);
 end loop;
end;$$;
revoke execute on function public.cancel_activity(uuid) from public, anon;
grant execute on function public.cancel_activity(uuid) to authenticated;

-- After the start time the organiser marks each person present (with hours) or absent. Default hours = the length of the activity.
create function public.confirm_volunteer(p_activity uuid, p_user uuid, p_present boolean, p_hours numeric default null) returns void
language plpgsql security definer set search_path='' as $$
declare a record; v_hours numeric;
begin
 select * into a from public.activities where id = p_activity and organiser_id = (select auth.uid());
 if a.id is null or a.starts_at > now() then raise exception 'not allowed' using errcode = '42501'; end if;
 if not exists (select 1 from public.activity_members where activity_id = p_activity and user_id = p_user and status in ('joined','confirmed','absent')) then
  raise exception 'not a volunteer here' using errcode = 'check_violation';
 end if;
 v_hours := least(24, greatest(0, coalesce(p_hours, round(extract(epoch from (a.ends_at - a.starts_at)) / 1800) / 2)));
 update public.activity_members
  set status = case when p_present then 'confirmed' else 'absent' end, hours = case when p_present then v_hours else 0 end
  where activity_id = p_activity and user_id = p_user;
 if p_present then perform public.notify(p_user, 'Hours confirmed', a.title || ' · ' || v_hours || ' h', '/app/activities/' || p_activity); end if;
end;$$;
revoke execute on function public.confirm_volunteer(uuid, uuid, boolean, numeric) from public, anon;
grant execute on function public.confirm_volunteer(uuid, uuid, boolean, numeric) to authenticated;

create or replace function public.notification_title_km(p_title text) returns text language sql immutable set search_path='' as $$
 select case p_title
  when 'New quote' then 'សម្រង់តម្លៃថ្មី'
  when 'Quote accepted' then 'សម្រង់តម្លៃត្រូវបានទទួលយក'
  when 'Quote declined' then 'សម្រង់តម្លៃត្រូវបានបដិសេធ'
  when 'Work delivered' then 'ការងារបានប្រគល់'
  when 'Job confirmed' then 'ការងារបានបញ្ជាក់'
  when 'Job cancelled' then 'ការងារត្រូវបានលុបចោល'
  when 'New review' then 'ការវាយតម្លៃថ្មី'
  when 'New message' then 'សារថ្មី'
  when 'New comment' then 'មតិថ្មី'
  when 'New application' then 'ការដាក់ពាក្យថ្មី'
  when 'Dispute opened' then 'វិវាទត្រូវបានបើក'
  when 'Dispute resolved' then 'វិវាទបានដោះស្រាយ'
  when 'Dispute dismissed' then 'វិវាទត្រូវបានបដិសេធ'
  when 'Dispute reviewing' then 'វិវាទកំពុងពិនិត្យ'
  when 'Identity checked' then 'អត្តសញ្ញាណបានត្រួតពិនិត្យ'
  when 'Identity check rejected' then 'អត្តសញ្ញាណត្រូវបានបដិសេធ'
  when 'Project invitation' then 'ការអញ្ជើញឱ្យធ្វើគម្រោង'
  when 'Message request' then 'សំណើផ្ញើសារ'
  when 'Request accepted' then 'សំណើត្រូវបានទទួលយក'
  when 'Added to a group' then 'បានបន្ថែមទៅក្រុម'
  when 'Activity joined' then 'មានអ្នកចូលរួមសកម្មភាព'
  when 'Activity spot' then 'មានកន្លែងទំនេរក្នុងសកម្មភាព'
  when 'Activity cancelled' then 'សកម្មភាពត្រូវបានលុបចោល'
  when 'Hours confirmed' then 'ម៉ោងស្ម័គ្រចិត្តត្រូវបានបញ្ជាក់'
  else p_title end
$$;

commit;
