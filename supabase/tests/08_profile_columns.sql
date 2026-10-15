-- Piron Work | rule test 08 | a person cannot change their own trust fields (0046)
-- Rolls back. por = a normal account (not an admin). Replace the id if it changes.
-- Expected result line:
--   RESULT identity_update=blocked jobs_update=blocked bio_update=allowed identity_after=f jobs_after=<unchanged>
do $$
declare por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee'; own uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2';
 r1 text; r2 text; r3 text; v1 boolean; v_before int; v_after int; iid uuid; v_admin boolean;
begin
 update public.profiles set identity_checked = false where id = por;
 select completed_jobs into v_before from public.profiles where id = por;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 begin update public.profiles set identity_checked = true where id = por; r1 := 'allowed'; exception when others then r1 := 'blocked'; end;
 begin update public.profiles set completed_jobs = 99 where id = por; r2 := 'allowed'; exception when others then r2 := 'blocked'; end;
 begin update public.profiles set bio = 'rule test bio' where id = por; r3 := 'allowed'; exception when others then r3 := sqlerrm; end;
 reset role;
 select identity_checked, completed_jobs into v1, v_after from public.profiles where id = por;
 raise exception 'RESULT identity_update=% jobs_update=% bio_update=% identity_after=% jobs_after=%',
  r1, r2, r3, v1, case when v_after = v_before then '<unchanged>' else v_after::text end;
end $$;
