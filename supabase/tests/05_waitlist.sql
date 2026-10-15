-- Piron Work | rule test 05 | volunteer waiting list (0025)
-- Rolls back; creates one throw-away account. por organises, pir joins first, the throw-away account waits.
-- Expected result line:
--   RESULT first_joiner=joined second_joiner=waitlist after_first_leaves: second=joined first=gone spot_notification=1 second_in_chat=1
do $$
declare por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee'; pir uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; u3 uuid := gen_random_uuid();
 act uuid; s_pir text; s_u3 text; st_u3 text; st_pir text; n_spot int; n_in_chat int; conv uuid;
begin
 insert into auth.users(id, aud, role, email) values (u3, 'authenticated', 'authenticated', 'third@test.invalid');
 if not exists (select 1 from public.profiles where id = u3) then insert into public.profiles(id, display_name) values (u3, 'Third test'); end if;
 update public.profiles set identity_checked = true where id = por;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 act := public.create_activity('Waitlist test', 'A test of the waiting list for one place.', 'Street', 'Phnom Penh', now() + interval '3 days', now() + interval '3 days 2 hours', 1, null);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', pir, 'role', 'authenticated')::text, true);
 set local role authenticated;
 s_pir := public.join_activity(act);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
 set local role authenticated;
 s_u3 := public.join_activity(act);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', pir, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.leave_activity(act);
 reset role;
 st_u3 := (select status from public.activity_members where activity_id = act and user_id = u3);
 st_pir := coalesce((select status from public.activity_members where activity_id = act and user_id = pir), 'gone');
 n_spot := (select count(*) from public.notifications where user_id = u3 and title = 'Activity spot');
 select conversation_id into conv from public.activities where id = act;
 n_in_chat := (select count(*) from public.conversation_members where conversation_id = conv and user_id = u3);
 raise exception 'RESULT first_joiner=% second_joiner=% after_first_leaves: second=% first=% spot_notification=% second_in_chat=%', s_pir, s_u3, st_u3, st_pir, n_spot, n_in_chat;
end $$;
