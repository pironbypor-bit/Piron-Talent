-- Piron Work | rule test 14 | Piron Work Space monthly report, CSV rows, audit view (0052)
-- Rolls back. own = the owner account, por = a normal account. Replace the ids if they change.
-- Expected result line:
--   RESULT report=t report_keys=7 people_rows_match=t jobs=t invoices=t bad_kind=unknown export audit=t por_report=null por_export=null por_audit=null anon=denied no_private_columns=t
do $$
declare own uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee';
 r jsonb; p jsonb; j jsonb; i jsonb; a jsonb; r_bad text; n_prof int; n_rows int; pr jsonb; pe jsonb; pa jsonb; r_anon text; keys text;
begin
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 r := public.space_report(date '2026-10-01');
 p := public.space_export('people');
 j := public.space_export('jobs');
 i := public.space_export('invoices');
 a := public.space_audit('', 50);
 begin perform public.space_export('everything'); r_bad := 'allowed'; exception when others then r_bad := sqlerrm; end;
 reset role;
 n_prof := (select count(*) from public.profiles);
 n_rows := jsonb_array_length(p);
 select string_agg(k, ',') into keys from (select distinct jsonb_object_keys(x) k from jsonb_array_elements(p || j || i) x) q;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 pr := public.space_report(date '2026-10-01');
 pe := public.space_export('people');
 pa := public.space_audit('', 10);
 reset role;
 perform set_config('request.jwt.claims', '', true);
 set local role anon;
 begin perform public.space_report(null); r_anon := 'allowed'; exception when others then r_anon := case when sqlerrm like 'permission denied%' then 'denied' else sqlerrm end; end;
 reset role;
 raise exception 'RESULT report=% report_keys=% people_rows_match=% jobs=% invoices=% bad_kind=% audit=% por_report=% por_export=% por_audit=% anon=% no_private_columns=%',
  case when r is null then 'null' else 't' end, (select count(*) from jsonb_object_keys(r)), n_rows = n_prof,
  jsonb_typeof(j) = 'array', jsonb_typeof(i) = 'array', r_bad, jsonb_typeof(a) = 'array',
  coalesce(pr::text, 'null'), coalesce(pe::text, 'null'), coalesce(pa::text, 'null'), r_anon,
  keys !~* '(email|phone|number_id|id_number|address)' ;
end $$;
