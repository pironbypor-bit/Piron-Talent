-- Piron Work | rule test 12 | Piron Work Space feature switches (0050)
-- Rolls back. own = the owner account, por = a normal account. Needs the seeded feature 'payments'. Replace the ids if they change.
-- Expected result line:
--   RESULT anon_everyone=t off_por=f off_owner=f only_me_owner=t only_me_por=f people_por=t removed_por=f back_everyone_por=t por_set=owner only por_list=null log_rows=6
do $$
declare own uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee';
 a boolean; off_por boolean; off_own boolean; me_own boolean; me_por boolean; pe_por boolean; rm_por boolean; bk_por boolean; r_set text; p_list jsonb; n_log int;
begin
 update public.feature_flags set mode = 'everyone' where key = 'payments';
 set local role anon;
 a := 'payments' = any (public.my_features());
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.space_set_feature('payments', 'off');
 off_own := 'payments' = any (public.my_features());
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 off_por := 'payments' = any (public.my_features());
 begin perform public.space_set_feature('payments', 'everyone'); r_set := 'allowed'; exception when others then r_set := sqlerrm; end;
 p_list := public.space_features();
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.space_set_feature('payments', 'owner');
 me_own := 'payments' = any (public.my_features());
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 me_por := 'payments' = any (public.my_features());
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.space_set_feature('payments', 'people');
 perform public.space_feature_person('payments', por, true);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 pe_por := 'payments' = any (public.my_features());
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.space_feature_person('payments', por, false);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 rm_por := 'payments' = any (public.my_features());
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.space_set_feature('payments', 'everyone');
 n_log := jsonb_array_length(public.space_feature_log());
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 bk_por := 'payments' = any (public.my_features());
 reset role;
 raise exception 'RESULT anon_everyone=% off_por=% off_owner=% only_me_owner=% only_me_por=% people_por=% removed_por=% back_everyone_por=% por_set=% por_list=% log_rows=%',
  a, off_por, off_own, me_own, me_por, pe_por, rm_por, bk_por, r_set, coalesce(p_list::text, 'null'), n_log;
end $$;
