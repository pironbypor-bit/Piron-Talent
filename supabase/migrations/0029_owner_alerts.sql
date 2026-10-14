-- Piron Work | migration 0029 | owner alerts in the notification centre (notification plan step 5, 2026-10-14)
-- Run after 0028_job_alerts.sql in the Supabase SQL editor.
-- Every admin is notified when something needs a person: an identity check, a report, a dispute, a project
-- request, a provider application. At most ten per kind per admin per hour, so a spam burst cannot flood.
begin;

create function public.notify_admins(p_title text, p_body text, p_link text) returns void
language plpgsql security definer set search_path='' as $$
declare a record;
begin
 for a in select user_id from public.admins loop
  if (select count(*) from public.notifications n where n.user_id = a.user_id and n.title = p_title and n.created_at > now() - interval '1 hour') < 10 then
   perform public.notify(a.user_id, p_title, left(coalesce(p_body, ''), 120), p_link);
  end if;
 end loop;
end;$$;
revoke execute on function public.notify_admins(text, text, text) from public, anon, authenticated;

create function public.alert_identity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.notify_admins('New identity check', coalesce((select display_name from public.profiles where id = new.user_id), '') || ' · ' || coalesce(new.legal_name, ''), '/admin/identity');
 return new;
end;$$;
create trigger identity_checks_alert after insert on public.identity_checks for each row execute function public.alert_identity();

create function public.alert_report() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.notify_admins('New report', new.target_type || ': ' || new.reason, '/admin/reports');
 return new;
end;$$;
create trigger reports_alert after insert on public.reports for each row execute function public.alert_report();

create function public.alert_dispute() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.notify_admins('New dispute', new.reason, '/admin/disputes');
 return new;
end;$$;
create trigger disputes_alert after insert on public.disputes for each row execute function public.alert_dispute();

create function public.alert_request() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.notify_admins('New project request', new.contact_name || coalesce(' · ' || new.business_name, ''), '/admin/requests/' || new.id);
 return new;
end;$$;
create trigger project_requests_alert after insert on public.project_requests for each row execute function public.alert_request();

create function public.alert_application() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.notify_admins('New provider application', new.full_name || ' · ' || new.city, '/admin');
 return new;
end;$$;
create trigger provider_applications_alert after insert on public.provider_applications for each row execute function public.alert_application();

-- What is waiting, for the Admin count. Only admins get numbers; everyone else gets zeros.
create function public.admin_counts() returns table(identity integer, reports integer, disputes integer, requests integer, applications integer)
language sql stable security definer set search_path='' as $$
 select
  case when a.ok then (select count(*)::int from public.identity_checks where status = 'pending') else 0 end,
  case when a.ok then (select count(*)::int from public.reports where status = 'open') else 0 end,
  case when a.ok then (select count(*)::int from public.disputes where status in ('open','reviewing')) else 0 end,
  case when a.ok then (select count(*)::int from public.project_requests where status = 'new') else 0 end,
  case when a.ok then (select count(*)::int from public.provider_applications where status = 'new') else 0 end
 from (select exists (select 1 from public.admins where user_id = (select auth.uid())) as ok) a
$$;
revoke execute on function public.admin_counts() from public, anon;
grant execute on function public.admin_counts() to authenticated;





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
  when 'New identity check' then 'ការពិនិត្យអត្តសញ្ញាណថ្មី'
  when 'New report' then 'របាយការណ៍ថ្មី'
  when 'New dispute' then 'វិវាទថ្មី'
  when 'New project request' then 'សំណើគម្រោងថ្មី'
  when 'New provider application' then 'ពាក្យសុំអ្នកផ្តល់សេវាថ្មី'
  else p_title end
$$;

commit;
