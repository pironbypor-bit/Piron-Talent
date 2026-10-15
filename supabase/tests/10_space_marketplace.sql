-- Piron Work | rule test 10 | Piron Work Space Marketplace health (0048)
-- Rolls back. own = the owner account, por = a normal account. Replace the ids if they change.
-- Expected result line:
--   RESULT owner=t funnel_keys=6 por=null funnel_fn=denied anon=denied
do $$
declare own uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee';
 o jsonb; p jsonb; r_fn text; r_anon text;
begin
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 o := public.space_marketplace();
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 p := public.space_marketplace();
 begin perform public.space_funnel(now()); r_fn := 'allowed'; exception when others then r_fn := case when sqlerrm like 'permission denied%' then 'denied' else sqlerrm end; end;
 reset role;
 perform set_config('request.jwt.claims', '', true);
 set local role anon;
 begin perform public.space_marketplace(); r_anon := 'allowed'; exception when others then r_anon := case when sqlerrm like 'permission denied%' then 'denied' else sqlerrm end; end;
 reset role;
 raise exception 'RESULT owner=% funnel_keys=% por=% funnel_fn=% anon=%',
  case when o is null then 'null' else 't' end, (select count(*) from jsonb_object_keys(o->'funnel_all')), coalesce(p::text, 'null'), r_fn, r_anon;
end $$;
