-- Piron Work | migration 0052 | Piron Work Space step 7: monthly report, CSV exports, audit log view (owner only)
begin;

create function public.space_report(p_month date default null) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
 m date := date_trunc('month', coalesce(p_month, (now() at time zone 'Asia/Phnom_Penh')::date))::date;
 s timestamptz := m::timestamp at time zone 'Asia/Phnom_Penh';
 e timestamptz := (m + interval '1 month')::timestamp at time zone 'Asia/Phnom_Penh';
 rev numeric; cst numeric;
begin
 if not public.is_owner() then return null; end if;
 select coalesce(sum(amount) filter (where kind = 'income'), 0), coalesce(sum(amount) filter (where kind = 'cost'), 0) into rev, cst from public.space_finance_in_month(m);
 return jsonb_build_object(
  'month', m,
  'people', jsonb_build_object(
   'new', (select count(*) from public.profiles where created_at >= s and created_at < e),
   'total_at_end', (select count(*) from public.profiles where created_at < e),
   'providers_now', (select count(*) from public.profiles where is_available),
   'identity_checked_now', (select count(*) from public.profiles where identity_checked),
   'paused_now', (select count(*) from public.profiles where paused_at is not null)),
  'market', jsonb_build_object(
   'projects', (select count(*) from public.posts where kind = 'need_help' and created_at >= s and created_at < e),
   'quotes', (select count(*) from public.quotes where post_id is not null and created_at >= s and created_at < e),
   'accepted', (select count(*) from public.project_jobs where created_at >= s and created_at < e),
   'delivered', (select count(*) from public.project_jobs where delivered_at >= s and delivered_at < e),
   'confirmed', (select count(*) from public.project_jobs where confirmed_at >= s and confirmed_at < e),
   'reviews', (select count(*) from public.reviews where created_at >= s and created_at < e),
   'avg_stars', (select round(avg(stars)::numeric, 2) from public.reviews where created_at >= s and created_at < e),
   'messages', (select count(*) from public.messages where created_at >= s and created_at < e),
   'companies_new', (select count(*) from public.businesses where created_at >= s and created_at < e)),
  'money', jsonb_build_object(
   'revenue', rev, 'costs', cst, 'profit', rev - cst,
   'volume', coalesce((select sum(i.amount) from public.invoices i where i.status = 'received' and i.currency = 'USD' and i.received_at >= s and i.received_at < e), 0)),
  'errors', jsonb_build_object(
   'new', (select count(*) from public.app_errors where first_seen >= s and first_seen < e),
   'seen', (select count(*) from public.app_errors where last_seen >= s and last_seen < e),
   'open_now', (select count(*) from public.app_errors where status = 'open')),
  'admin_actions', (select count(*) from public.audit_log where created_at >= s and created_at < e),
  'reports_filed', (select count(*) from public.reports where created_at >= s and created_at < e));
end;$$;

-- Rows for the CSV downloads. No email, phone or ID number in any of them.
create function public.space_export(p_kind text) returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_owner() then return null; end if;
 if p_kind = 'people' then
  return coalesce((select jsonb_agg(to_jsonb(r) order by r."Joined" desc) from (
   select p.display_name as "Name", p.role_line as "Role", p.city as "City", p.created_at::date as "Joined", p.is_available as "Provider",
    p.identity_checked as "Identity checked", p.completed_jobs as "Confirmed jobs", (p.paused_at is not null) as "Paused",
    (select count(*) from public.posts x where x.author_id = p.id) as "Posts"
   from public.profiles p order by p.created_at desc limit 5000) r), '[]'::jsonb);
 elsif p_kind = 'jobs' then
  return coalesce((select jsonb_agg(to_jsonb(r) order by r."Started" desc) from (
   select po.title as "Project", j.status as "Status", j.agreed_price as "Agreed price", c.display_name as "Customer", v.display_name as "Provider",
    j.created_at::date as "Started", j.delivered_at::date as "Delivered", j.confirmed_at::date as "Confirmed"
   from public.project_jobs j join public.posts po on po.id = j.post_id
   left join public.profiles c on c.id = j.customer_id left join public.profiles v on v.id = j.provider_id
   order by j.created_at desc limit 5000) r), '[]'::jsonb);
 elsif p_kind = 'invoices' then
  return coalesce((select jsonb_agg(to_jsonb(r) order by r."Issued" desc) from (
   select i.number as "Number", i.issuer_name as "From", i.customer_name as "To", i.title as "Title", i.amount as "Amount", i.currency as "Currency",
    i.status as "Status", i.issued_at::date as "Issued", i.received_at::date as "Received"
   from public.invoices i order by i.issued_at desc limit 5000) r), '[]'::jsonb);
 end if;
 raise exception 'unknown export';
end;$$;

-- The audit log with the actor's name. p_prefix filters by how the action starts ('' = everything).
create function public.space_audit(p_prefix text default '', p_limit int default 100) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare w text := replace(replace(coalesce(trim(p_prefix), ''), '%', ''), '_', '') || '%';
begin
 if not public.is_owner() then return null; end if;
 return coalesce((select jsonb_agg(to_jsonb(r) order by r.at desc) from (
  select a.created_at as at, a.action, a.target, (select display_name from public.profiles p where p.id = a.actor_id) as actor
  from public.audit_log a where a.action like w order by a.created_at desc limit least(greatest(coalesce(p_limit, 100), 1), 500)) r), '[]'::jsonb);
end;$$;

revoke execute on function public.space_report(date) from public, anon;
revoke execute on function public.space_export(text) from public, anon;
revoke execute on function public.space_audit(text, int) from public, anon;
grant execute on function public.space_report(date) to authenticated;
grant execute on function public.space_export(text) to authenticated;
grant execute on function public.space_audit(text, int) to authenticated;

commit;
