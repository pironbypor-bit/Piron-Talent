-- Piron Work | rule test 04 | mute groups (0043), organiser identity rule and trigger grants (0044)
-- Rolls back. por = the account that mutes and organises, pir receives a message. Replace the ids if they change.
-- Expected result line:
--   RESULT muted_team=0 money_still_arrives=1 team_after_unmute=1 organiser_unchecked=identity check needed organiser_checked=allowed
--          anon_can_run_trigger_fn=f authenticated_can_run_trigger_fn=f message_trigger_fired=1
do $$
declare por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee'; pir uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2';
 n_team int; n_money int; r_org1 text; r_org2 text; anon_exec boolean; auth_exec boolean; conv uuid; n_msg int; act uuid; n_after_unmute int;
begin
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.set_notification_group('team', false);
 reset role;
 perform public.notify(por, 'Task assigned', 'x', '/app');
 perform public.notify(por, 'Invoice received', 'x', '/app');
 n_team := (select count(*) from public.notifications where user_id = por and title = 'Task assigned' and created_at > now() - interval '1 minute');
 n_money := (select count(*) from public.notifications where user_id = por and title = 'Invoice received' and created_at > now() - interval '1 minute');
 set local role authenticated;
 perform public.set_notification_group('team', true);
 reset role;
 perform public.notify(por, 'Task assigned', 'x', '/app');
 n_after_unmute := (select count(*) from public.notifications where user_id = por and title = 'Task assigned' and created_at > now() - interval '1 minute');
 update public.profiles set identity_checked = false where id = por;
 set local role authenticated;
 begin act := public.create_activity('Rule test', 'A test of the organiser rule here.', 'Street', 'Phnom Penh', now() + interval '2 days', now() + interval '2 days 2 hours', 5, null); r_org1 := 'allowed'; exception when others then r_org1 := sqlerrm; end;
 reset role;
 update public.profiles set identity_checked = true where id = por;
 set local role authenticated;
 begin act := public.create_activity('Rule test', 'A test of the organiser rule here.', 'Street', 'Phnom Penh', now() + interval '2 days', now() + interval '2 days 2 hours', 5, null); r_org2 := 'allowed'; exception when others then r_org2 := sqlerrm; end;
 reset role;
 anon_exec := has_function_privilege('anon', 'public.notify_message()', 'execute');
 auth_exec := has_function_privilege('authenticated', 'public.notify_message()', 'execute');
 insert into public.conversations(kind, created_by) values ('direct', por) returning id into conv;
 insert into public.conversation_members(conversation_id, user_id) values (conv, por), (conv, pir);
 set local role authenticated;
 insert into public.messages(conversation_id, sender_id, body) values (conv, por, 'trigger test');
 reset role;
 n_msg := (select count(*) from public.notifications where user_id = pir and title = 'New message' and created_at > now() - interval '1 minute');
 raise exception 'RESULT muted_team=% money_still_arrives=% team_after_unmute=% organiser_unchecked=% organiser_checked=% anon_can_run_trigger_fn=% authenticated_can_run_trigger_fn=% message_trigger_fired=%',
  n_team, n_money, n_after_unmute, r_org1, r_org2, anon_exec, auth_exec, n_msg;
end $$;
