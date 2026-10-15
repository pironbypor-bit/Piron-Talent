-- Piron Work | rule test 11 | Piron Work Space Errors: grouping, alert, owner only (0049)
-- Rolls back. own = the owner account, por = a normal account. Replace the ids if they change.
-- Expected result line:
--   RESULT rows=1 count=5 alert_notifications=1 owner_list=1 fixed=fixed reopened=open por_list=null por_set=owner only por_table_rows=0 anon_list=denied
do $$
declare own uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee';
 i int; n_rows int; v_count int; n_alert int; n_list int; eid bigint; s_fixed text; s_reopen text; p_list jsonb; r_set text; n_por int; r_anon text;
begin
 set local role anon;
 for i in 1..5 loop perform public.log_app_error('page', 'Rule test error 0f0f0f0f-1111-2222-3333-444444444444', '/app/post/0f0f0f0f-1111-2222-3333-444444444444'); end loop;
 reset role;
 select count(*), max(count), max(id) into n_rows, v_count, eid from public.app_errors where message like 'Rule test error%';
 n_alert := (select count(*) from public.notifications where user_id = own and title = 'App error repeating' and created_at > now() - interval '1 minute');
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 n_list := jsonb_array_length(public.space_errors('open'));
 perform public.space_set_error_status(eid, 'fixed');
 reset role;
 s_fixed := (select status from public.app_errors where id = eid);
 perform public.log_app_error('page', 'Rule test error 0f0f0f0f-1111-2222-3333-444444444444', '/app/post/0f0f0f0f-1111-2222-3333-444444444444');
 s_reopen := (select status from public.app_errors where id = eid);
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 p_list := public.space_errors('open');
 begin perform public.space_set_error_status(eid, 'ignored'); r_set := 'allowed'; exception when others then r_set := sqlerrm; end;
 n_por := (select count(*) from public.app_errors);
 reset role;
 perform set_config('request.jwt.claims', '', true);
 set local role anon;
 begin perform public.space_errors('open'); r_anon := 'allowed'; exception when others then r_anon := case when sqlerrm like 'permission denied%' then 'denied' else sqlerrm end; end;
 reset role;
 raise exception 'RESULT rows=% count=% alert_notifications=% owner_list=% fixed=% reopened=% por_list=% por_set=% por_table_rows=% anon_list=%',
  n_rows, v_count, n_alert, n_list, s_fixed, s_reopen, coalesce(p_list::text, 'null'), r_set, n_por, r_anon;
end $$;
