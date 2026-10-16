-- Piron Work | rule test 15 | bookings: request, suggest, accept, decline, cancel, expire, blocks, owner of data (0055, 0056)
-- Rolls back. cu = customer (the owner account), pv = provider (POR). Replace the ids if they change.
-- Expected result line:
--   RESULT self=you cannot book yourself duplicate=you already have an open request with this person status_after_counter=countered job_price=25.00 job_status=accepted new_quote_notice=0 post_visible_anon=0 post_visible_provider=1 other_answer=not allowed provider_cancel=not allowed decline=declined cancel=cancelled expired=1 blocked=not allowed paused=this person is not taking bookings anon=denied
do $$
declare cu uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; pv uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee';
 b1 uuid; b2 uuid; b3 uuid; b4 uuid; post uuid; r_self text; r_dup text; s1 text; jp text; js text; nq int; va int; vp int; r_other text; r_cancel_job text; s_dec text; s_can text; n_exp int; r_blk text; r_pause text; r_anon text;
begin
 update public.profiles set is_available = true, paused_at = null where id in (cu, pv);
 perform set_config('request.jwt.claims', json_build_object('sub', cu, 'role', 'authenticated')::text, true);
 set local role authenticated;
 begin perform public.request_booking(cu, 'x y z', null, null, null); r_self := 'allowed'; exception when others then r_self := sqlerrm; end;
 b1 := public.request_booking(pv, 'Fix two ceiling fans', now() + interval '1 day', 'Phnom Penh', 20);
 begin perform public.request_booking(pv, 'Another job please', null, null, null); r_dup := 'allowed'; exception when others then r_dup := sqlerrm; end;
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', pv, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.answer_booking(b1, 'counter', 25, null, null);
 s1 := (select status from public.booking_requests where id = b1);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', cu, 'role', 'authenticated')::text, true);
 set local role authenticated;
 post := public.answer_counter(b1, true);
 reset role;
 select agreed_price::text, 'accepted' into jp, js from public.booking_requests where id = b1 and status = 'accepted';
 nq := (select count(*) from public.notifications where user_id = cu and title = 'New quote' and created_at > now() - interval '1 minute');
 set local role anon;
 va := (select count(*) from public.posts where id = post);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', pv, 'role', 'authenticated')::text, true);
 set local role authenticated;
 vp := (select count(*) from public.posts where id = post);
 begin perform public.cancel_booking(b1); r_cancel_job := 'allowed'; exception when others then r_cancel_job := sqlerrm; end;
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', cu, 'role', 'authenticated')::text, true);
 set local role authenticated;
 b2 := public.request_booking(pv, 'Paint a small wall', null, null, 30);
 begin perform public.answer_booking(b2, 'decline', null, null, 'x'); r_other := 'allowed'; exception when others then r_other := sqlerrm; end;
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', pv, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.answer_booking(b2, 'decline', null, null, 'Too busy');
 s_dec := (select status from public.booking_requests where id = b2);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', cu, 'role', 'authenticated')::text, true);
 set local role authenticated;
 b3 := public.request_booking(pv, 'Clean the shop windows', null, null, 15);
 perform public.cancel_booking(b3);
 s_can := (select status from public.booking_requests where id = b3);
 b4 := public.request_booking(pv, 'Install a shelf', null, null, 10);
 reset role;
 update public.booking_requests set expires_at = now() - interval '1 minute' where id = b4;
 n_exp := public.expire_bookings();
 insert into public.user_blocks(blocker_id, blocked_id) values (pv, cu) on conflict do nothing;
 perform set_config('request.jwt.claims', json_build_object('sub', cu, 'role', 'authenticated')::text, true);
 set local role authenticated;
 begin perform public.request_booking(pv, 'Blocked attempt', null, null, null); r_blk := 'allowed'; exception when others then r_blk := sqlerrm; end;
 reset role;
 delete from public.user_blocks where blocker_id = pv and blocked_id = cu;
 update public.profiles set paused_at = now() where id = pv;
 perform set_config('request.jwt.claims', json_build_object('sub', cu, 'role', 'authenticated')::text, true);
 set local role authenticated;
 begin perform public.request_booking(pv, 'Paused attempt', null, null, null); r_pause := 'allowed'; exception when others then r_pause := sqlerrm; end;
 reset role;
 perform set_config('request.jwt.claims', '', true);
 set local role anon;
 begin perform public.request_booking(pv, 'Visitor attempt', null, null, null); r_anon := 'allowed'; exception when others then r_anon := case when sqlerrm like 'permission denied%' then 'denied' else sqlerrm end; end;
 reset role;
 raise exception 'RESULT self=% duplicate=% status_after_counter=% job_price=% job_status=% new_quote_notice=% post_visible_anon=% post_visible_provider=% other_answer=% customer_cancel_own_job=% decline=% cancel=% expired=% blocked=% paused=% anon=%',
  r_self, r_dup, s1, jp, js, nq, va, vp, r_other, r_cancel_job, s_dec, s_can, n_exp, r_blk, r_pause, r_anon;
end $$;
