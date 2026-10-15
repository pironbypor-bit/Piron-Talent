-- Piron Work | rule test 09 | Piron Work Space People: summary, list, person, pause (0047)
-- Rolls back. own = the owner account, por = a normal account. Replace the ids if they change.
-- Expected result line:
--   RESULT summary=t list_matches_total=t person=t paused_set=t available_after_pause=f paused_filter=1 por_people=null por_person=null por_pause=owner only por_clear=blocked self_pause=you cannot pause yourself resumed=t audit_rows=2
do $$
declare own uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee';
 s jsonb; l jsonb; pr jsonb; v_avail boolean; v_paused timestamptz; n_filter int; p_l jsonb; p_p jsonb; r_pause text; r_clear text; r_self text; v_resumed timestamptz; n_audit int;
begin
 update public.profiles set is_available = true, paused_at = null where id = por;
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 s := public.space_people_summary();
 l := public.space_people(null, 'all', 200);
 pr := public.space_person(por);
 perform public.space_set_paused(por, true, 'rule test');
 n_filter := jsonb_array_length(public.space_people(null, 'paused', 50));
 begin perform public.space_set_paused(own, true, null); r_self := 'allowed'; exception when others then r_self := sqlerrm; end;
 reset role;
 select is_available, paused_at into v_avail, v_paused from public.profiles where id = por;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 p_l := public.space_people(null, 'all', 10);
 p_p := public.space_person(por);
 begin perform public.space_set_paused(por, false, null); r_pause := 'allowed'; exception when others then r_pause := sqlerrm; end;
 begin update public.profiles set paused_at = null where id = por; r_clear := 'allowed'; exception when others then r_clear := 'blocked'; end;
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', own, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.space_set_paused(por, false, null);
 n_audit := (select count(*) from public.audit_log where action in ('Account paused', 'Account resumed'));
 reset role;
 select paused_at into v_resumed from public.profiles where id = por;
 raise exception 'RESULT summary=% list_matches_total=% person=% paused_set=% available_after_pause=% paused_filter=% por_people=% por_person=% por_pause=% por_clear=% self_pause=% resumed=% audit_rows=%',
  case when s is null then 'null' else 't' end,
  jsonb_array_length(l) = (s->>'total')::int,
  case when pr is null then 'null' else 't' end,
  v_paused is not null, v_avail, n_filter,
  coalesce(p_l::text, 'null'), coalesce(p_p::text, 'null'), r_pause, r_clear, r_self, v_resumed is null, n_audit;
end $$;
