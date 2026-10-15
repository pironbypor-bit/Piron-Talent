-- Piron Work | rule test 06 | reminders (0027): every kind fires once, a second run sends nothing
-- Rolls back. Note: it clears reminder_log for the two accounts inside the transaction only.
-- Expected result line:
--   RESULT first_run=7 second_run=0 sent=[Activity reminder x2, Availability ends soon x1, Confirm the work x1, Deadline tomorrow x1, Hire again? x1, Quote waiting x1]
-- (first_run can be higher if real data also qualifies; the sent list is what matters.)
do $$
declare por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee'; pir uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2';
 p1 uuid; p2 uuid; p3 uuid; p4 uuid; q1 uuid; q2 uuid; q3 uuid; q4 uuid; act uuid; first_run int; second_run int; res text;
begin
 insert into public.posts(author_id, kind, title, body, status) values (por, 'need_help', 'Reminder test A', 'quote waiting test body', 'published') returning id into p1;
 insert into public.quotes(post_id, provider_id, price, status, created_at) values (p1, pir, 30, 'pending', now() - interval '30 hours') returning id into q1;
 insert into public.posts(author_id, kind, title, body, status) values (por, 'need_help', 'Reminder test B', 'confirm work test body', 'published') returning id into p2;
 insert into public.quotes(post_id, provider_id, price, status) values (p2, pir, 40, 'accepted') returning id into q2;
 insert into public.project_jobs(post_id, quote_id, customer_id, provider_id, agreed_price, status, delivered_at) values (p2, q2, por, pir, 40, 'delivered', now() - interval '3 days');
 insert into public.posts(author_id, kind, title, body, status, deadline) values (por, 'need_help', 'Reminder test C', 'deadline test body', 'published', (now() at time zone 'Asia/Phnom_Penh')::date + 1) returning id into p3;
 insert into public.quotes(post_id, provider_id, price, status) values (p3, pir, 50, 'accepted') returning id into q3;
 insert into public.project_jobs(post_id, quote_id, customer_id, provider_id, agreed_price, status) values (p3, q3, por, pir, 50, 'accepted');
 insert into public.posts(author_id, kind, title, body, status) values (por, 'need_help', 'Reminder test D', 'hire again test body', 'published') returning id into p4;
 insert into public.quotes(post_id, provider_id, price, status) values (p4, pir, 60, 'accepted') returning id into q4;
 insert into public.project_jobs(post_id, quote_id, customer_id, provider_id, agreed_price, status, confirmed_at) values (p4, q4, por, pir, 60, 'confirmed', now() - interval '35 days');
 update public.profiles set available_until = now() + interval '10 hours' where id = pir;
 insert into public.activities(organiser_id, title, description, starts_at, ends_at, capacity) values (por, 'Tomorrow soon', 'Activity starting in a few hours for the test.', now() + interval '3 hours', now() + interval '5 hours', 5) returning id into act;
 insert into public.activity_members(activity_id, user_id, status) values (act, pir, 'joined');
 delete from public.reminder_log where user_id in (por, pir);
 first_run := public.send_reminders();
 select string_agg(title || ' x' || n, ', ' order by title) into res from (select title, count(*) as n from public.notifications where user_id in (por, pir) and title in ('Quote waiting', 'Confirm the work', 'Deadline tomorrow', 'Availability ends soon', 'Hire again?', 'Activity reminder') and created_at >= now() - interval '1 minute' group by title) x;
 second_run := public.send_reminders();
 raise exception 'RESULT first_run=% second_run=% sent=[%]', first_run, second_run, res;
end $$;
