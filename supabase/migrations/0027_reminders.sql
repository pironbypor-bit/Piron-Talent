-- Piron Work | migration 0027 | scheduled reminders with pg_cron (notification plan step 4, 2026-10-14)
-- Run after 0026_attachments_blocks.sql in the Supabase SQL editor.
-- Every 30 minutes send_reminders() looks for six situations and notifies once per person and case.
begin;

create extension if not exists pg_cron;

alter table public.profile_private add column reminders_enabled boolean not null default true;

create function public.set_reminders(p_on boolean) returns void language sql security definer set search_path='' as $$
 insert into public.profile_private(user_id, reminders_enabled) values ((select auth.uid()), p_on)
 on conflict (user_id) do update set reminders_enabled = excluded.reminders_enabled
$$;
revoke execute on function public.set_reminders(boolean) from public, anon;
grant execute on function public.set_reminders(boolean) to authenticated;

-- One row per reminder sent, so nothing repeats. No policies: clients cannot read or write it.
create table public.reminder_log (
 kind text not null,
 ref text not null,
 user_id uuid not null references public.profiles(id) on delete cascade,
 sent_at timestamptz not null default now(),
 primary key (kind, ref, user_id)
);
alter table public.reminder_log enable row level security;

create function public.remind_once(p_kind text, p_ref text, p_user uuid, p_title text, p_body text, p_link text) returns boolean
language plpgsql security definer set search_path='' as $$
declare c integer;
begin
 if not coalesce((select reminders_enabled from public.profile_private where user_id = p_user), true) then return false; end if;
 insert into public.reminder_log(kind, ref, user_id) values (p_kind, p_ref, p_user) on conflict do nothing;
 get diagnostics c = row_count;
 if c = 0 then return false; end if;
 perform public.notify(p_user, p_title, p_body, p_link);
 return true;
end;$$;
revoke execute on function public.remind_once(text, text, uuid, text, text, text) from public, anon, authenticated;

create function public.send_reminders() returns integer language plpgsql security definer set search_path='' as $$
declare n integer := 0; r record; v_today date := (now() at time zone 'Asia/Phnom_Penh')::date;
begin
 -- 1. A quote has waited a day for the customer's answer (only the last two weeks, so a first run does not flood).
 for r in
  select q.id::text as ref, p.author_id as uid, p.title, p.id as post_id, pr.display_name as who
  from public.quotes q join public.posts p on p.id = q.post_id join public.profiles pr on pr.id = q.provider_id
  where q.status = 'pending' and q.created_at < now() - interval '24 hours' and q.created_at > now() - interval '14 days'
    and p.status = 'published' and not public.post_has_active_job(p.id)
 loop
  if public.remind_once('quote_waiting', r.ref, r.uid, 'Quote waiting', r.who || ' · ' || r.title, '/app/post/' || r.post_id) then n := n + 1; end if;
 end loop;

 -- 2. Delivered work the customer has not confirmed for two days.
 for r in
  select j.id::text as ref, j.customer_id as uid, p.title, j.post_id
  from public.project_jobs j join public.posts p on p.id = j.post_id
  where j.status = 'delivered' and j.delivered_at < now() - interval '48 hours' and j.delivered_at > now() - interval '21 days'
 loop
  if public.remind_once('confirm_work', r.ref, r.uid, 'Confirm the work', r.title, '/app/post/' || r.post_id) then n := n + 1; end if;
 end loop;

 -- 3. The provider's deadline is tomorrow (Phnom Penh date) and the work is not delivered.
 for r in
  select j.id::text as ref, j.provider_id as uid, p.title, j.post_id
  from public.project_jobs j join public.posts p on p.id = j.post_id
  where j.status = 'accepted' and p.deadline = v_today + 1
 loop
  if public.remind_once('deadline_tomorrow', r.ref, r.uid, 'Deadline tomorrow', r.title, '/app/post/' || r.post_id) then n := n + 1; end if;
 end loop;

 -- 4. "Available this week" ends within a day.
 for r in
  select id::text || ':' || available_until::date::text as ref, id as uid
  from public.profiles where available_until > now() and available_until < now() + interval '24 hours'
 loop
  if public.remind_once('availability_ending', r.ref, r.uid, 'Availability ends soon', '', '/app/profile') then n := n + 1; end if;
 end loop;

 -- 5. Hire again: 30 days after a confirmed job, with the rehire link.
 for r in
  select j.id::text as ref, j.customer_id as uid, p.title, j.post_id, j.provider_id, pr.display_name as who
  from public.project_jobs j join public.posts p on p.id = j.post_id join public.profiles pr on pr.id = j.provider_id
  where j.status = 'confirmed' and j.confirmed_at < now() - interval '30 days' and j.confirmed_at > now() - interval '45 days'
 loop
  if public.remind_once('hire_again', r.ref, r.uid, 'Hire again?', r.who || ' · ' || r.title, '/app/post/new?rehire=' || r.post_id || '&to=' || r.provider_id) then n := n + 1; end if;
 end loop;

 -- 6. A volunteer activity starts within a day: the organiser and everyone who is in.
 for r in
  select a.id::text as ref, a.title, a.id as activity_id, a.organiser_id as uid
  from public.activities a where a.status = 'open' and a.starts_at > now() and a.starts_at < now() + interval '24 hours'
  union all
  select a.id::text, a.title, a.id, m.user_id
  from public.activities a join public.activity_members m on m.activity_id = a.id
  where a.status = 'open' and a.starts_at > now() and a.starts_at < now() + interval '24 hours' and m.status = 'joined'
 loop
  if public.remind_once('activity_soon', r.ref, r.uid, 'Activity reminder', r.title, '/app/activities/' || r.activity_id) then n := n + 1; end if;
 end loop;

 return n;
end;$$;
revoke execute on function public.send_reminders() from public, anon, authenticated;

select cron.schedule('piron-reminders', '*/30 * * * *', 'select public.send_reminders()');

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
  when 'Quote waiting' then 'សម្រង់តម្លៃកំពុងរង់ចាំចម្លើយ'
  when 'Confirm the work' then 'សូមបញ្ជាក់ការងារ'
  when 'Deadline tomorrow' then 'ថ្ងៃស្អែកគឺកំណត់ពេល'
  when 'Availability ends soon' then 'ភាពទំនេរជិតផុតកំណត់'
  when 'Hire again?' then 'ជួលម្តងទៀតទេ?'
  when 'Activity reminder' then 'ការរំលឹកសកម្មភាព'
  else p_title end
$$;

commit;
