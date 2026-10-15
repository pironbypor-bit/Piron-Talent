-- Piron Work | migration 0051 | Piron Work Space step 6: Money (the owner's own book: revenue and costs, monthly report)
-- Run after 0050_feature_switches.sql. Owner only. This is bookkeeping for Piron Work itself; users' money is never touched.
begin;

create table public.finance_entries (
 id bigint generated always as identity primary key,
 kind text not null check (kind in ('income', 'cost')),
 month date not null check (month = date_trunc('month', month)::date),
 ends_month date check (ends_month is null or ends_month = date_trunc('month', ends_month)::date),
 entry_type text not null check (char_length(entry_type) between 1 and 40),
 amount numeric(12, 2) not null check (amount >= 0 and amount < 100000000),
 note text check (note is null or char_length(note) <= 120),
 repeats boolean not null default false,
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now()
);
create index finance_entries_month_idx on public.finance_entries (month);
alter table public.finance_entries enable row level security;
revoke all on public.finance_entries from anon, authenticated;

-- Entries that count in month m: one-off entries of that month, and repeating ones that started on or before m
-- and have not been stopped before m.
create function public.space_finance_in_month(m date) returns setof public.finance_entries language sql stable security definer set search_path = '' as $$
 select * from public.finance_entries e
 where (not e.repeats and e.month = m)
    or (e.repeats and e.month <= m and (e.ends_month is null or e.ends_month >= m));
$$;
revoke execute on function public.space_finance_in_month(date) from public, anon, authenticated;

create function public.space_money(p_month date default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
 m date := date_trunc('month', coalesce(p_month, (now() at time zone 'Asia/Phnom_Penh')::date))::date;
begin
 if not public.is_owner() then return null; end if;
 return jsonb_build_object(
  'month', m,
  'entries', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'type', e.entry_type, 'amount', e.amount, 'note', e.note,
     'repeats', e.repeats, 'starts', e.month, 'ends', e.ends_month) order by e.kind, e.entry_type)
    from public.space_finance_in_month(m) e), '[]'::jsonb),
  'volume', coalesce((select sum(i.amount) from public.invoices i
    where i.status = 'received' and i.currency = 'USD'
      and date_trunc('month', i.received_at at time zone 'Asia/Phnom_Penh')::date = m), 0),
  'months', (select jsonb_agg(jsonb_build_object('month', g.d::date,
      'revenue', (select coalesce(sum(e.amount), 0) from public.space_finance_in_month(g.d::date) e where e.kind = 'income'),
      'costs', (select coalesce(sum(e.amount), 0) from public.space_finance_in_month(g.d::date) e where e.kind = 'cost'),
      'volume', coalesce((select sum(i.amount) from public.invoices i where i.status = 'received' and i.currency = 'USD'
         and date_trunc('month', i.received_at at time zone 'Asia/Phnom_Penh')::date = g.d::date), 0)) order by g.d desc)
    from generate_series(m - interval '5 months', m, interval '1 month') g(d)));
end;$$;

create function public.space_money_add(p_kind text, p_month date, p_type text, p_amount numeric, p_note text default null, p_repeats boolean default false) returns void
language plpgsql security definer set search_path = '' as $$
declare m date := date_trunc('month', p_month)::date;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
 if p_kind not in ('income', 'cost') then raise exception 'bad kind'; end if;
 if coalesce(trim(p_type), '') = '' then raise exception 'type needed'; end if;
 insert into public.finance_entries(kind, month, entry_type, amount, note, repeats, created_by)
  values (p_kind, m, left(trim(p_type), 40), p_amount, nullif(left(trim(coalesce(p_note, '')), 120), ''), coalesce(p_repeats, false), (select auth.uid()));
 insert into public.audit_log(actor_id, action, target)
  values ((select auth.uid()), 'Money entry added', p_kind || ' ' || left(trim(p_type), 40) || ' ' || p_amount || ' for ' || to_char(m, 'YYYY-MM'));
end;$$;

create function public.space_money_delete(p_id bigint) returns void language plpgsql security definer set search_path = '' as $$
declare e public.finance_entries;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
 delete from public.finance_entries where id = p_id returning * into e;
 if e.id is null then raise exception 'entry not found'; end if;
 insert into public.audit_log(actor_id, action, target)
  values ((select auth.uid()), 'Money entry deleted', e.kind || ' ' || e.entry_type || ' ' || e.amount || ' for ' || to_char(e.month, 'YYYY-MM'));
end;$$;

-- Stop a repeating entry from the given month on (it still counts in the months before).
create function public.space_money_stop(p_id bigint, p_month date) returns void language plpgsql security definer set search_path = '' as $$
declare e public.finance_entries; m date := date_trunc('month', p_month)::date;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
 select * into e from public.finance_entries where id = p_id and repeats;
 if e.id is null then raise exception 'not a repeating entry'; end if;
 if m <= e.month then
  delete from public.finance_entries where id = p_id;
 else
  update public.finance_entries set ends_month = (m - interval '1 month')::date where id = p_id;
 end if;
 insert into public.audit_log(actor_id, action, target)
  values ((select auth.uid()), 'Money entry stopped', e.kind || ' ' || e.entry_type || ' from ' || to_char(m, 'YYYY-MM'));
end;$$;

-- Every entry that counts, month by month, for the CSV download.
create function public.space_money_export(p_months int default 12) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare cur date := date_trunc('month', (now() at time zone 'Asia/Phnom_Penh')::date)::date;
begin
 if not public.is_owner() then return null; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('month', g.d::date, 'kind', e.kind, 'type', e.entry_type, 'amount', e.amount, 'note', e.note, 'repeats', e.repeats)
    order by g.d desc, e.kind, e.entry_type)
  from generate_series(cur - make_interval(months => least(greatest(coalesce(p_months, 12), 1), 36) - 1), cur, interval '1 month') g(d)
  cross join lateral public.space_finance_in_month(g.d::date) e), '[]'::jsonb);
end;$$;

revoke execute on function public.space_money(date) from public, anon;
revoke execute on function public.space_money_add(text, date, text, numeric, text, boolean) from public, anon;
revoke execute on function public.space_money_delete(bigint) from public, anon;
revoke execute on function public.space_money_stop(bigint, date) from public, anon;
revoke execute on function public.space_money_export(int) from public, anon;
grant execute on function public.space_money(date) to authenticated;
grant execute on function public.space_money_add(text, date, text, numeric, text, boolean) to authenticated;
grant execute on function public.space_money_delete(bigint) to authenticated;
grant execute on function public.space_money_stop(bigint, date) to authenticated;
grant execute on function public.space_money_export(int) to authenticated;

commit;
