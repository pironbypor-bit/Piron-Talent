-- Piron Work | rule test 03 | team shifts and tasks (0037, 0038, 0042)
-- Rolls back; creates its own company. por = owner, pir = member. Replace the ids if they change.
-- Expected result line:
--   RESULT member_shifts=2 member_tasks=1 add=not allowed clock_foreign=not allowed clock_own=allowed clock_future=outside the shift time
--          status_unassigned=not allowed status_own=allowed delete=not allowed former_task=not allowed former_clock=not allowed
do $$
declare por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee'; pir uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2';
 biz uuid; sh_por uuid; sh_pir uuid; sh_fut uuid; t_pir uuid; t_free uuid;
 n_sh int; n_t int; r_add text; r_for text; r_own text; r_fut text; r_free text; r_mine text; r_del text; r_ft text; r_fc text;
begin
 insert into public.businesses(owner_id, name) values (por, 'Rule test company') returning id into biz;
 insert into public.business_members(business_id, user_id, role) values (biz, por, 'owner'), (biz, pir, 'member');
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 sh_por := public.add_team_shift(biz, por, now() - interval '5 minutes', now() + interval '2 hours', 'owner shift');
 sh_pir := public.add_team_shift(biz, pir, now() - interval '5 minutes', now() + interval '2 hours', 'member shift');
 sh_fut := public.add_team_shift(biz, pir, now() + interval '2 days', now() + interval '2 days 4 hours', 'later');
 t_pir := public.add_team_task(biz, 'Wipe the tables', null, pir, null);
 t_free := public.add_team_task(biz, 'Order napkins', null, null, null);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', pir, 'role', 'authenticated')::text, true);
 set local role authenticated;
 n_sh := (select count(*) from public.team_shifts where business_id = biz);
 n_t := (select count(*) from public.team_tasks where business_id = biz);
 begin perform public.add_team_shift(biz, pir, now() + interval '5 days', now() + interval '5 days 2 hours', 'x'); r_add := 'allowed'; exception when others then r_add := sqlerrm; end;
 begin perform public.clock_shift(sh_por, 'in'); r_for := 'allowed'; exception when others then r_for := sqlerrm; end;
 begin perform public.clock_shift(sh_pir, 'in'); r_own := 'allowed'; exception when others then r_own := sqlerrm; end;
 begin perform public.clock_shift(sh_fut, 'in'); r_fut := 'allowed'; exception when others then r_fut := sqlerrm; end;
 begin perform public.set_task_status(t_free, 'done'); r_free := 'allowed'; exception when others then r_free := sqlerrm; end;
 begin perform public.set_task_status(t_pir, 'doing'); r_mine := 'allowed'; exception when others then r_mine := sqlerrm; end;
 begin perform public.delete_team_task(t_pir); r_del := 'allowed'; exception when others then r_del := sqlerrm; end;
 reset role;
 delete from public.business_members where business_id = biz and user_id = pir;
 perform set_config('request.jwt.claims', json_build_object('sub', pir, 'role', 'authenticated')::text, true);
 set local role authenticated;
 begin perform public.set_task_status(t_pir, 'done'); r_ft := 'allowed'; exception when others then r_ft := sqlerrm; end;
 begin perform public.clock_shift(sh_pir, 'out'); r_fc := 'allowed'; exception when others then r_fc := sqlerrm; end;
 reset role;
 raise exception 'RESULT member_shifts=% member_tasks=% add=% clock_foreign=% clock_own=% clock_future=% status_unassigned=% status_own=% delete=% former_task=% former_clock=%',
  n_sh, n_t, r_add, r_for, r_own, r_fut, r_free, r_mine, r_del, r_ft, r_fc;
end $$;
