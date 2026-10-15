-- Piron Work | migration 0039 | invoices and payment records for accepted projects
-- Run after 0038_task_status_fix.sql. RECORDS ONLY: Piron Work does not take, hold or move money.
-- The provider issues an invoice for work that was agreed; the customer marks it paid; the provider confirms it was received.
-- Not a tax invoice. Everything is written through the functions below.
begin;

create table public.invoices (
 id uuid primary key default gen_random_uuid(),
 number text not null check (length(number) <= 30),
 job_id uuid not null references public.project_jobs(id),
 issuer_id uuid not null references public.profiles(id),
 customer_id uuid not null references public.profiles(id),
 issuer_name text not null,
 customer_name text not null,
 title text not null,
 amount numeric(12,2) not null check (amount > 0),
 currency text not null default 'USD',
 note text check (note is null or length(note) <= 500),
 due_on date,
 status text not null default 'issued' check (status in ('issued','paid_claimed','received','void')),
 paid_method text check (paid_method is null or paid_method in ('cash','bank','aba','wing','other')),
 paid_on date,
 paid_ref text check (paid_ref is null or length(paid_ref) <= 60),
 issued_at timestamptz not null default now(),
 claimed_at timestamptz,
 received_at timestamptz,
 void_at timestamptz,
 unique (issuer_id, number),
 check (issuer_id <> customer_id)
);
create index invoices_issuer_idx on public.invoices(issuer_id, issued_at desc);
create index invoices_customer_idx on public.invoices(customer_id, issued_at desc);
create index invoices_job_idx on public.invoices(job_id);
alter table public.invoices enable row level security;
create policy invoices_read on public.invoices for select to authenticated
 using (issuer_id = (select auth.uid()) or customer_id = (select auth.uid()) or public.is_admin());

create function public.create_invoice(p_job uuid, p_amount numeric, p_due date, p_note text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); j record; v_title text; v_cust text; v_iss text; v_biz uuid; v_used numeric; v_n int; v_num text; v_id uuid;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 select * into j from public.project_jobs where id = p_job for update;
 if j.id is null or j.provider_id <> v_me then raise exception 'not allowed' using errcode = '42501'; end if;
 if j.status = 'cancelled' then raise exception 'job cancelled' using errcode = 'check_violation'; end if;
 if p_amount is null or p_amount <= 0 then raise exception 'bad amount' using errcode = '22023'; end if;
 select coalesce(sum(amount), 0), count(*) into v_used, v_n from public.invoices where job_id = p_job and status <> 'void';
 if v_used + p_amount > j.agreed_price + 0.005 then raise exception 'over the agreed price' using errcode = 'check_violation'; end if;
 if v_n >= 20 then raise exception 'too many invoices' using errcode = 'check_violation'; end if;
 select title, business_id into v_title, v_biz from public.posts where id = j.post_id;
 select display_name into v_iss from public.profiles where id = v_me;
 select coalesce((select name from public.businesses where id = v_biz), (select display_name from public.profiles where id = j.customer_id)) into v_cust;
 select count(*) + 1 into v_n from public.invoices where issuer_id = v_me and issued_at >= date_trunc('year', now());
 v_num := 'PW-' || to_char(now() at time zone 'Asia/Phnom_Penh', 'YYYY') || '-' || lpad(v_n::text, 4, '0');
 insert into public.invoices(number, job_id, issuer_id, customer_id, issuer_name, customer_name, title, amount, currency, note, due_on)
 values (v_num, p_job, v_me, j.customer_id, v_iss, v_cust, left(v_title, 120), round(p_amount, 2), j.currency, nullif(left(trim(coalesce(p_note, '')), 500), ''), p_due)
 returning id into v_id;
 perform public.notify(j.customer_id, 'Invoice received', v_num || ' · $' || round(p_amount, 2) || ' · ' || left(v_title, 60), '/app/invoices/' || v_id);
 return v_id;
end;$$;

create function public.mark_invoice_paid(p_invoice uuid, p_method text, p_paid_on date, p_ref text) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); i record;
begin
 select * into i from public.invoices where id = p_invoice for update;
 if i.id is null or i.customer_id <> v_me then raise exception 'not allowed' using errcode = '42501'; end if;
 if i.status <> 'issued' then raise exception 'not open' using errcode = 'check_violation'; end if;
 if p_method not in ('cash','bank','aba','wing','other') then raise exception 'bad method' using errcode = '22023'; end if;
 update public.invoices set status = 'paid_claimed', paid_method = p_method, paid_on = coalesce(p_paid_on, (now() at time zone 'Asia/Phnom_Penh')::date),
  paid_ref = nullif(left(trim(coalesce(p_ref, '')), 60), ''), claimed_at = now() where id = p_invoice;
 perform public.notify(i.issuer_id, 'Payment marked as paid', i.number || ' · $' || i.amount, '/app/invoices/' || p_invoice);
end;$$;

-- The provider confirms the money arrived. From "issued" the provider can record a payment taken in person.
create function public.confirm_invoice_payment(p_invoice uuid, p_method text, p_paid_on date) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); i record;
begin
 select * into i from public.invoices where id = p_invoice for update;
 if i.id is null or i.issuer_id <> v_me then raise exception 'not allowed' using errcode = '42501'; end if;
 if i.status not in ('issued','paid_claimed') then raise exception 'not open' using errcode = 'check_violation'; end if;
 if i.status = 'issued' and p_method not in ('cash','bank','aba','wing','other') then raise exception 'bad method' using errcode = '22023'; end if;
 update public.invoices set status = 'received', received_at = now(),
  paid_method = coalesce(paid_method, p_method), paid_on = coalesce(paid_on, p_paid_on, (now() at time zone 'Asia/Phnom_Penh')::date) where id = p_invoice;
 perform public.notify(i.customer_id, 'Payment received', i.number || ' · $' || i.amount, '/app/invoices/' || p_invoice);
end;$$;

create function public.reject_invoice_payment(p_invoice uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); i record;
begin
 select * into i from public.invoices where id = p_invoice for update;
 if i.id is null or i.issuer_id <> v_me then raise exception 'not allowed' using errcode = '42501'; end if;
 if i.status <> 'paid_claimed' then raise exception 'not open' using errcode = 'check_violation'; end if;
 update public.invoices set status = 'issued', paid_method = null, paid_on = null, paid_ref = null, claimed_at = null where id = p_invoice;
 perform public.notify(i.customer_id, 'Payment not received', i.number || ' · $' || i.amount, '/app/invoices/' || p_invoice);
end;$$;

create function public.void_invoice(p_invoice uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); i record;
begin
 select * into i from public.invoices where id = p_invoice for update;
 if i.id is null or i.issuer_id <> v_me then raise exception 'not allowed' using errcode = '42501'; end if;
 if i.status <> 'issued' then raise exception 'not open' using errcode = 'check_violation'; end if;
 update public.invoices set status = 'void', void_at = now() where id = p_invoice;
 perform public.notify(i.customer_id, 'Invoice cancelled', i.number, '/app/invoices/' || p_invoice);
end;$$;

revoke execute on function public.create_invoice(uuid, numeric, date, text) from public, anon;
revoke execute on function public.mark_invoice_paid(uuid, text, date, text) from public, anon;
revoke execute on function public.confirm_invoice_payment(uuid, text, date) from public, anon;
revoke execute on function public.reject_invoice_payment(uuid) from public, anon;
revoke execute on function public.void_invoice(uuid) from public, anon;
grant execute on function public.create_invoice(uuid, numeric, date, text) to authenticated;
grant execute on function public.mark_invoice_paid(uuid, text, date, text) to authenticated;
grant execute on function public.confirm_invoice_payment(uuid, text, date) to authenticated;
grant execute on function public.reject_invoice_payment(uuid) to authenticated;
grant execute on function public.void_invoice(uuid) to authenticated;

commit;
