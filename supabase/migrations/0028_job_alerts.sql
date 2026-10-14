-- Piron Work | migration 0028 | job alerts by category and province (notification plan, 2026-10-14)
-- Run after 0027_reminders.sql in the Supabase SQL editor.
-- A person keeps up to five alerts. A new published job, or a new open project (need_help post), that matches sends
-- one 'Job alert' notification, at most five per person per day.
begin;

create table public.job_alerts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 category_id bigint references public.categories(id) on delete cascade,
 city text check (city is null or length(city) <= 40),
 created_at timestamptz not null default now(),
 check (category_id is not null or city is not null)
);
create unique index job_alerts_unique_idx on public.job_alerts (user_id, coalesce(category_id, 0), coalesce(city, ''));
alter table public.job_alerts enable row level security;
create policy job_alerts_own_read on public.job_alerts for select to authenticated using (user_id = (select auth.uid()));
create policy job_alerts_own_delete on public.job_alerts for delete to authenticated using (user_id = (select auth.uid()));

create function public.add_job_alert(p_category bigint, p_city text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_id uuid; v_city text := nullif(trim(coalesce(p_city, '')), '');
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if p_category is null and v_city is null then raise exception 'choose a category or a province' using errcode = 'check_violation'; end if;
 if (select count(*) from public.job_alerts where user_id = v_me) >= 5 then raise exception 'too many alerts' using errcode = 'check_violation'; end if;
 insert into public.job_alerts(user_id, category_id, city) values (v_me, p_category, v_city) returning id into v_id;
 return v_id;
exception when unique_violation then
 return null;
end;$$;
revoke execute on function public.add_job_alert(bigint, text) from public, anon;
grant execute on function public.add_job_alert(bigint, text) to authenticated;

create function public.notify_job_alerts_job() returns trigger language plpgsql security definer set search_path='' as $$
declare r record;
begin
 if new.status <> 'published' then return new; end if;
 if tg_op = 'UPDATE' and old.status = 'published' then return new; end if;
 for r in
  select distinct a.user_id from public.job_alerts a
  where a.user_id <> new.poster_id
    and (a.category_id is null or a.category_id = new.category_id)
    and (a.city is null or lower(trim(coalesce(new.city, ''))) = lower(a.city))
    and (select count(*) from public.notifications n where n.user_id = a.user_id and n.title = 'Job alert' and n.created_at > now() - interval '1 day') < 5
 loop
  perform public.notify(r.user_id, 'Job alert', new.title, '/app/jobs/' || new.id);
 end loop;
 return new;
end;$$;
create trigger jobs_alert after insert or update of status on public.jobs for each row execute function public.notify_job_alerts_job();

create function public.notify_job_alerts_post() returns trigger language plpgsql security definer set search_path='' as $$
declare r record;
begin
 if new.kind <> 'need_help' or new.status <> 'published' or new.opens_at is not null then return new; end if;
 for r in
  select distinct a.user_id from public.job_alerts a
  where a.user_id <> new.author_id
    and (a.category_id is null or a.category_id = new.category_id)
    and (a.city is null or coalesce(new.place, '') ilike '%' || a.city || '%')
    and (select count(*) from public.notifications n where n.user_id = a.user_id and n.title = 'Job alert' and n.created_at > now() - interval '1 day') < 5
 loop
  perform public.notify(r.user_id, 'Job alert', new.title, '/app/post/' || new.id);
 end loop;
 return new;
end;$$;
create trigger posts_alert after insert on public.posts for each row execute function public.notify_job_alerts_post();

create or replace function public.notification_title_km(p_title text) returns text language sql immutable set search_path='' as $
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
  when 'Job alert' then 'ការជូនដំណឹងការងារ'
  else p_title end
$$;

commit;
