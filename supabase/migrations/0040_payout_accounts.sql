-- Piron Work | migration 0040 | verified payout accounts (identity side of getting paid; NO money handling)
-- Run after 0039_invoices.sql. A provider says where they would like to be paid; the Piron team checks that the account
-- holder name matches the name on the approved ID. Nothing here holds, moves or records money.
begin;

create table public.payout_accounts (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 method text not null check (method in ('aba','wing','bank')),
 account_name text not null check (length(account_name) between 2 and 100),
 account_number text not null check (length(account_number) between 3 and 40),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 note text check (note is null or length(note) <= 300),
 updated_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references public.profiles(id)
);
alter table public.payout_accounts enable row level security;
create policy payout_accounts_read on public.payout_accounts for select to authenticated
 using (user_id = (select auth.uid()) or public.is_admin());

-- Any change goes back to "pending" for a new name check.
create function public.set_payout_account(p_method text, p_name text, p_number text) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid());
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if p_method not in ('aba','wing','bank') then raise exception 'bad method' using errcode = '22023'; end if;
 if length(trim(coalesce(p_name, ''))) < 2 or length(trim(coalesce(p_number, ''))) < 3 then raise exception 'details needed' using errcode = '22023'; end if;
 insert into public.payout_accounts(user_id, method, account_name, account_number)
 values (v_me, p_method, left(trim(p_name), 100), left(trim(p_number), 40))
 on conflict (user_id) do update set method = excluded.method, account_name = excluded.account_name, account_number = excluded.account_number,
  status = 'pending', note = null, updated_at = now(), reviewed_at = null, reviewed_by = null;
 perform public.notify_admins('Payout account to review', coalesce((select display_name from public.profiles where id = v_me), ''), '/admin/payout-accounts');
end;$$;

create function public.admin_review_payout_account(p_user uuid, p_approve boolean, p_note text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform public.assert_admin();
 update public.payout_accounts set status = case when p_approve then 'approved' else 'rejected' end,
  note = nullif(left(trim(coalesce(p_note, '')), 300), ''), reviewed_at = now(), reviewed_by = (select auth.uid())
 where user_id = p_user and status = 'pending';
 if found then
  perform public.notify(p_user, case when p_approve then 'Payout account approved' else 'Payout account rejected' end, left(coalesce(p_note, ''), 100), '/app/profile/payout');
 end if;
end;$$;

-- A public yes or no: approved account and a checked identity. Reveals nothing about the account itself.
create function public.is_payout_verified(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.payout_accounts a join public.profiles p on p.id = a.user_id
                where a.user_id = p_user and a.status = 'approved' and p.identity_checked)
$$;

revoke execute on function public.set_payout_account(text, text, text) from public, anon;
revoke execute on function public.admin_review_payout_account(uuid, boolean, text) from public, anon;
grant execute on function public.set_payout_account(text, text, text) to authenticated;
grant execute on function public.admin_review_payout_account(uuid, boolean, text) to authenticated;
grant execute on function public.is_payout_verified(uuid) to anon, authenticated;

commit;
