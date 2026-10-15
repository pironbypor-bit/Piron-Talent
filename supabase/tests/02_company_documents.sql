-- Piron Work | rule test 02 | company documents and the public page (0033, 0034)
-- Rolls back. Creates its own company, two throw-away accounts and files rows; nothing is left behind.
-- Replace POR and PIR with two real account ids if they change (por = owner, pir = manager).
-- Expected result line:
--   RESULT manager_publish=only the owner can publish manager_team=allowed owner_publish=allowed anon_page_off=0 anon_page_on=1
--          member_sees=3 outsider_sees=1 public_docs=1 manager_sees=3
do $$
declare por uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee'; pir uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2';
 u3 uuid := gen_random_uuid(); u4 uuid := gen_random_uuid(); biz uuid; d1 uuid; d2 uuid; d3 uuid;
 r_mp text; r_mt text; r_op text; a_off int; a_on int; m_sees int; o_sees int; pub int; mg_sees int;
begin
 insert into auth.users(id, aud, role, email) values (u3, 'authenticated', 'authenticated', 'member@test.invalid'), (u4, 'authenticated', 'authenticated', 'outsider@test.invalid');
 insert into public.profiles(id, display_name) select x, 'Throwaway' from unnest(array[u3, u4]) x where not exists (select 1 from public.profiles where id = x);
 insert into public.businesses(owner_id, name) values (por, 'Rule test company') returning id into biz;
 insert into public.business_members(business_id, user_id, role) values (biz, por, 'owner'), (biz, pir, 'manager'), (biz, u3, 'member');
 insert into public.business_documents(business_id, name, path, mime, bytes, level, uploaded_by) values
  (biz, 'a.pdf', biz || '/a.pdf', 'application/pdf', 1000, 'private', por) returning id into d1;
 insert into public.business_documents(business_id, name, path, mime, bytes, level, uploaded_by) values
  (biz, 'b.pdf', biz || '/b.pdf', 'application/pdf', 1000, 'team', por) returning id into d2;
 insert into public.business_documents(business_id, name, path, mime, bytes, level, uploaded_by) values
  (biz, 'c.pdf', biz || '/c.pdf', 'application/pdf', 1000, 'private', por) returning id into d3;
 perform set_config('request.jwt.claims', json_build_object('sub', pir, 'role', 'authenticated')::text, true);
 set local role authenticated;
 begin perform public.set_document_level(d1, 'public'); r_mp := 'allowed'; exception when others then r_mp := sqlerrm; end;
 begin perform public.set_document_level(d1, 'team'); r_mt := 'allowed'; exception when others then r_mt := sqlerrm; end;
 mg_sees := (select count(*) from public.business_documents where business_id = biz);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', por, 'role', 'authenticated')::text, true);
 set local role authenticated;
 begin perform public.set_document_level(d3, 'public'); r_op := 'allowed'; exception when others then r_op := sqlerrm; end;
 reset role;
 perform set_config('request.jwt.claims', '', true);
 set local role anon;
 a_off := (select count(*) from public.business_documents where business_id = biz);
 reset role;
 update public.businesses set page_public = true where id = biz;
 set local role anon;
 a_on := (select count(*) from public.business_documents where business_id = biz);
 pub := jsonb_array_length((public.company_public(biz))->'documents');
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', u3, 'role', 'authenticated')::text, true);
 set local role authenticated;
 m_sees := (select count(*) from public.business_documents where business_id = biz);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', u4, 'role', 'authenticated')::text, true);
 set local role authenticated;
 o_sees := (select count(*) from public.business_documents where business_id = biz);
 reset role;
 raise exception 'RESULT manager_publish=% manager_team=% owner_publish=% anon_page_off=% anon_page_on=% member_sees=% outsider_sees=% public_docs=% manager_sees=%',
  r_mp, r_mt, r_op, a_off, a_on, m_sees, o_sees, pub, mg_sees;
end $$;
