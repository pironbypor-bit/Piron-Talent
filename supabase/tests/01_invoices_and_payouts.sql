-- Piron Work | rule test 01 | invoices (0039) and payout accounts (0040)
-- Run in the Supabase SQL editor. Everything rolls back: the block ends by raising an error that carries the result.
-- Needs two real accounts. pv is the provider and must NOT be an admin; cu is the customer. Replace the ids if they change.
-- Expected result line:
--   RESULT cap=over the agreed price customer_confirm=not allowed provider_pay=not allowed after_pay=paid_claimed after_reject=issued
--          final=received void_after=not open self_approve=admin only verified_no_identity=f verified=t after_change=pending verified_after_change=f
do $$
declare pv uuid := 'b1daa736-a391-4ad2-ae93-d8db21eef7ee'; cu uuid := 'ec5d079f-0c39-4941-adec-d7a9401441f2'; adm uuid;
 p uuid; q uuid; j uuid; inv uuid; r_cap text; r_c text; r_p text; s1 text; s2 text; s3 text; r_void text; r_self text; v0 boolean; v1 boolean; v2 boolean; s4 text;
begin
 select user_id into adm from public.admins limit 1;
 insert into public.posts(author_id, kind, title, body, status) values (cu, 'need_help', 'Rule test project', 'test body for the rules', 'published') returning id into p;
 insert into public.quotes(post_id, provider_id, price, status) values (p, pv, 45, 'accepted') returning id into q;
 insert into public.project_jobs(post_id, quote_id, customer_id, provider_id, agreed_price, status) values (p, q, cu, pv, 45, 'accepted') returning id into j;
 perform set_config('request.jwt.claims', json_build_object('sub', pv, 'role', 'authenticated')::text, true);
 set local role authenticated;
 inv := public.create_invoice(j, 20, null, 'Deposit');
 begin perform public.create_invoice(j, 30, null, 'Too much'); r_cap := 'allowed'; exception when others then r_cap := sqlerrm; end;
 begin perform public.mark_invoice_paid(inv, 'cash', current_date, null); r_p := 'allowed'; exception when others then r_p := sqlerrm; end;
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', cu, 'role', 'authenticated')::text, true);
 set local role authenticated;
 begin perform public.confirm_invoice_payment(inv, 'cash', current_date); r_c := 'allowed'; exception when others then r_c := sqlerrm; end;
 perform public.mark_invoice_paid(inv, 'aba', current_date, 'ABA-1');
 s1 := (select status from public.invoices where id = inv);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', pv, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.reject_invoice_payment(inv);
 s2 := (select status from public.invoices where id = inv);
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', cu, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.mark_invoice_paid(inv, 'wing', current_date, 'W-2');
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', pv, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.confirm_invoice_payment(inv, null, null);
 s3 := (select status from public.invoices where id = inv);
 begin perform public.void_invoice(inv); r_void := 'allowed'; exception when others then r_void := sqlerrm; end;
 perform public.set_payout_account('aba', 'Test Provider', '000111222');
 begin perform public.admin_review_payout_account(pv, true, 'self'); r_self := 'allowed'; exception when others then r_self := sqlerrm; end;
 reset role;
 perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.admin_review_payout_account(pv, true, 'ok');
 reset role;
 update public.profiles set identity_checked = false where id = pv;
 v0 := public.is_payout_verified(pv);
 update public.profiles set identity_checked = true where id = pv;
 v1 := public.is_payout_verified(pv);
 perform set_config('request.jwt.claims', json_build_object('sub', pv, 'role', 'authenticated')::text, true);
 set local role authenticated;
 perform public.set_payout_account('wing', 'Test Provider', '099333444');
 reset role;
 s4 := (select status from public.payout_accounts where user_id = pv);
 v2 := public.is_payout_verified(pv);
 raise exception 'RESULT cap=% customer_confirm=% provider_pay=% after_pay=% after_reject=% final=% void_after=% self_approve=% verified_no_identity=% verified=% after_change=% verified_after_change=%',
  r_cap, r_c, r_p, s1, s2, s3, r_void, r_self, v0, v1, s4, v2;
end $$;
