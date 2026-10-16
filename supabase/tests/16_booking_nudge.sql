-- Piron Work | rule test 16 | booking nudge after 24 hours (0057)
-- Rolls back. cu = customer (the owner account), pv = provider (POR). Replace the ids if they change.
-- Expected result line:
--   RESULT young_request=0 first_run=1 provider_notices=1 second_run=0 countered_run=1 customer_notices=1 switched_off_run=0
do $$
declare cu uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; pv uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee';
 b uuid; n0 int; n1 int; np int; n2 int; n3 int; nc int; n4 int;
begin
 update public.profiles set is_available = true, paused_at = null where id in (cu, pv);
 delete from public.reminder_log where user_id in (cu, pv);
 alter table public.booking_requests disable trigger booking_requests_updated;   -- so the test can set updated_at; rolled back
 insert into public.booking_requests(customer_id, provider_id, details, budget) values (cu, pv, 'Nudge rule test', 10) returning id into b;
 n0 := public.nudge_bookings();
 update public.booking_requests set updated_at = now() - interval '25 hours' where id = b;
 n1 := public.nudge_bookings();
 np := (select count(*) from public.notifications where user_id = pv and title = 'Booking waiting' and created_at > now() - interval '1 minute');
 n2 := public.nudge_bookings();
 update public.booking_requests set status = 'countered', counter_price = 12, updated_at = now() - interval '25 hours' where id = b;
 n3 := public.nudge_bookings();
 nc := (select count(*) from public.notifications where user_id = cu and title = 'Booking waiting' and created_at > now() - interval '1 minute');
 delete from public.reminder_log where user_id in (cu, pv);
 insert into public.profile_private(user_id, reminders_enabled) values (cu, false) on conflict (user_id) do update set reminders_enabled = false;
 n4 := public.nudge_bookings();
 raise exception 'RESULT young_request=% first_run=% provider_notices=% second_run=% countered_run=% customer_notices=% switched_off_run=%', n0, n1, np, n2, n3, nc, n4;
end $$;
