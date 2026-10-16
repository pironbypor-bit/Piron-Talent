-- Piron Work | migration 0057 | bookings: 24 hour nudge, and the owner numbers
-- Home in three pages, step 6. Patches existing functions in place (read the live definition, add lines, replace).
begin;

-- A booking request nobody answered for a day: remind the person who must answer, once per state.
create function public.nudge_bookings() returns int language plpgsql security definer set search_path = '' as $$
declare n int := 0; r record;
begin
 for r in
  select id::text as ref, status, case when status = 'requested' then provider_id else customer_id end as uid, details
  from public.booking_requests
  where status in ('requested', 'countered') and updated_at < now() - interval '24 hours' and expires_at > now()
 loop
  if public.remind_once('booking_waiting', r.ref || ':' || r.status, r.uid, 'Booking waiting', left(r.details, 100), '/app/bookings') then n := n + 1; end if;
 end loop;
 return n;
end;$$;
revoke execute on function public.nudge_bookings() from public, anon, authenticated;
select cron.schedule('piron-nudge-bookings', '*/30 * * * *', 'select public.nudge_bookings()');

do $p$
declare d text;
begin
 -- notice group and Khmer title for the nudge
 d := pg_get_functiondef('public.notification_group(text)'::regprocedure);
 d := replace(d, '''Booking request'',', '''Booking request'', ''Booking waiting'',');
 if position('Booking waiting' in d) = 0 then raise exception 'group patch did not apply'; end if;
 execute d;
 d := pg_get_functiondef('public.notification_title_km(text)'::regprocedure);
 d := replace(d, 'when ''Booking request'' then', 'when ''Booking waiting'' then ''សំណើកក់កំពុងរង់ចាំ'' when ''Booking request'' then');
 if position('Booking waiting' in d) = 0 then raise exception 'km patch did not apply'; end if;
 execute d;
 -- owner numbers: bookings in the Marketplace health block
 d := pg_get_functiondef('public.space_marketplace()'::regprocedure);
 d := replace(d, '''categories'', coalesce(',
  '''bookings'', jsonb_build_object(''requests_30d'', (select count(*) from public.booking_requests where created_at > now() - interval ''30 days''), '
  || '''agreed_30d'', (select count(*) from public.booking_requests where status = ''accepted'' and created_at > now() - interval ''30 days''), '
  || '''declined_30d'', (select count(*) from public.booking_requests where status = ''declined'' and created_at > now() - interval ''30 days''), '
  || '''expired_30d'', (select count(*) from public.booking_requests where status = ''expired'' and created_at > now() - interval ''30 days''), '
  || '''waiting_now'', (select count(*) from public.booking_requests where status in (''requested'', ''countered''))), '
  || '''categories'', coalesce(');
 if position('requests_30d' in d) = 0 then raise exception 'marketplace patch did not apply'; end if;
 execute d;
 -- owner numbers: bookings in the monthly report
 d := pg_get_functiondef('public.space_report(date)'::regprocedure);
 d := replace(d, '''messages'', (select count(*) from public.messages',
  '''bookings'', (select count(*) from public.booking_requests where created_at >= s and created_at < e), '
  || '''bookings_agreed'', (select count(*) from public.booking_requests where status = ''accepted'' and created_at >= s and created_at < e), '
  || '''messages'', (select count(*) from public.messages');
 if position('bookings_agreed' in d) = 0 then raise exception 'report patch did not apply'; end if;
 execute d;
end
$p$;

commit;
