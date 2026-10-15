-- Piron Work | rule test 13 | Piron Work Space Money: entries, monthly repeat, stop, delete, owner only (0051)
-- Rolls back. own = the owner account, por = a normal account. Replace the ids if they change.
-- Expected result line:
--   RESULT oct_entries=3 oct_revenue=42.00 oct_costs=19.00 sep_entries=1 after_stop_oct=2 sep_still=1 after_delete_oct=1 por_money=null por_add=owner only por_delete=owner only por_table=denied anon=denied audit_rows=5
do $$
declare own uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee';
 o jsonb; s jsonb; oct date := date '2096-10-01'; sep date := date '2096-09-01';
 rid bigint; oid bigint; n_oct int; rev text; cost text; n_sep int; n_stop int; n_sep2 int; n_del int;
 p jsonb; r_add text; r_del text; r_tab text; r_anon text; n_audit int;
begin
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.space_money_add('income', oct, 'Service fee', 42, 'rule test', false);
 perform public.space_money_add('cost', date '2096-08-01', 'Cloudflare', 5, null, true);
 perform public.space_money_add('cost', oct, 'Domain names', 14, null, false);
 o := public.space_money(oct);
 n_oct := jsonb_array_length(o->'entries');
 rev := (select sum((e->>'amount')::numeric)::text from jsonb_array_elements(o->'entries') e where e->>'kind' = 'income');
 cost := (select sum((e->>'amount')::numeric)::text from jsonb_array_elements(o->'entries') e where e->>'kind' = 'cost');
 s := public.space_money(sep);
 n_sep := jsonb_array_length(s->'entries');
 select (e->>'id')::bigint into rid from jsonb_array_elements(o->'entries') e where (e->>'repeats')::boolean limit 1;
 select (e->>'id')::bigint into oid from jsonb_array_elements(o->'entries') e where e->>'type' = 'Domain names' limit 1;
 perform public.space_money_stop(rid, oct);
 n_stop := jsonb_array_length((public.space_money(oct))->'entries');
 n_sep2 := jsonb_array_length((public.space_money(sep))->'entries');
 perform public.space_money_delete(oid);
 n_del := jsonb_array_length((public.space_money(oct))->'entries');
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 p := public.space_money(oct);
 begin perform public.space_money_add('income', oct, 'x', 1, null, false); r_add := 'allowed'; exception when others then r_add := sqlerrm; end;
 begin perform public.space_money_delete(rid); r_del := 'allowed'; exception when others then r_del := sqlerrm; end;
 begin perform count(*) from public.finance_entries; r_tab := 'allowed'; exception when others then r_tab := case when sqlerrm like 'permission denied%' then 'denied' else sqlerrm end; end;
 reset role;
 perform set_config('request.jwt.claims', '', true);
 set local role anon;
 begin perform public.space_money(oct); r_anon := 'allowed'; exception when others then r_anon := case when sqlerrm like 'permission denied%' then 'denied' else sqlerrm end; end;
 reset role;
 n_audit := (select count(*) from public.audit_log where action like 'Money entry%');
 raise exception 'RESULT oct_entries=% oct_revenue=% oct_costs=% sep_entries=% after_stop_oct=% sep_still=% after_delete_oct=% por_money=% por_add=% por_delete=% por_table=% anon=% audit_rows=%',
  n_oct, rev, cost, n_sep, n_stop, n_sep2, n_del, coalesce(p::text, 'null'), r_add, r_del, r_tab, r_anon, n_audit;
end $$;
