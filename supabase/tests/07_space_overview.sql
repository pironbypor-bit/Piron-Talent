-- Piron Work | rule test 07 | Piron Work Space overview, owner flag and audit log (0045)
-- Rolls back. own = the owner account (admins.is_owner), por = a normal account. Replace the ids if they change.
-- Expected result line:
--   RESULT owner_overview=t owner_is_owner=t needs_keys=6 por_overview=null por_is_owner=f por_log=admin only owner_log_rows=1 por_audit_rows=0 anon_overview=denied
do $$
declare own uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee';
 o jsonb; o_is boolean; keys int; p jsonb; p_is boolean; p_log text; n_own int; n_por int; a text;
begin
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 o := public.space_overview();
 o_is := public.is_owner();
 keys := (select count(*) from jsonb_object_keys(o->'needs'));
 perform public.log_admin_action('Rule test action', 'test');
 n_own := (select count(*) from public.audit_log where action = 'Rule test action');
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 p := public.space_overview();
 p_is := public.is_owner();
 begin perform public.log_admin_action('Rule test action', 'x'); p_log := 'allowed'; exception when others then p_log := sqlerrm; end;
 n_por := (select count(*) from public.audit_log);
 reset role;
 perform set_config('request.jwt.claims', '', true);
 set local role anon;
 begin perform public.space_overview(); a := 'allowed'; exception when others then a := case when sqlerrm like 'permission denied%' then 'denied' else sqlerrm end; end;
 reset role;
 raise exception 'RESULT owner_overview=% owner_is_owner=% needs_keys=% por_overview=% por_is_owner=% por_log=% owner_log_rows=% por_audit_rows=% anon_overview=%',
  case when o is null then 'null' else 't' end, o_is, keys, coalesce(p::text, 'null'), p_is, p_log, n_own, n_por, a;
end $$;
