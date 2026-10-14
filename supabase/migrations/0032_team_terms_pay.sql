-- Piron Work | migration 0032 | terms of work, private pay records and the org chart data (2026-10-15)
-- Run after 0031_company_team.sql in the Supabase SQL editor.
-- Private on purpose: terms (duties, rate) and pay are readable only by the company owner and the person they
-- are about. The job title is shown to the whole team (it feeds the org chart). No money moves here.
begin;

alter table public.business_members
 add column job_title text check (job_title is null or length(job_title) <= 80),
 add column duties text check (duties is null or length(duties) <= 1000),
 add column rate numeric(10,2) check (rate is null or rate >= 0),
 add column rate_unit text check (rate_unit is null or rate_unit in ('hour','day','month')),
 add column starts_on date;

alter table public.business_invitations
 add column job_title text check (job_title is null or length(job_title) <= 80),
 add column duties text check (duties is null or length(duties) <= 1000),
 add column rate numeric(10,2) check (rate is null or rate >= 0),
 add column rate_unit text check (rate_unit is null or rate_unit in ('hour','day','month'));

create function public.is_business_owner(b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.businesses x where x.id = b and x.owner_id = (select auth.uid()))
$$;
grant execute on function public.is_business_owner(uuid) to authenticated;

drop function public.invite_to_business(uuid, uuid, text);
create function public.invite_to_business(p_business uuid, p_user uuid, p_role text, p_title text default null, p_duties text default null, p_rate numeric default null, p_unit text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_role text; b record; v_id uuid;
begin
 select role into v_role from public.business_members where business_id = p_business and user_id = v_me;
 select * into b from public.businesses where id = p_business;
 if v_role is null or v_role = 'member' or b.id is null then raise exception 'not allowed' using errcode = '42501'; end if;
 if p_role not in ('manager','member') or (p_role = 'manager' and v_role <> 'owner') then raise exception 'not allowed' using errcode = '42501'; end if;
 if p_user = v_me or exists (select 1 from public.business_members where business_id = p_business and user_id = p_user) then raise exception 'already in the team' using errcode = 'check_violation'; end if;
 if (select count(*) from public.business_members where business_id = p_business) >= 20 then raise exception 'team is full' using errcode = 'check_violation'; end if;
 if not public.can_group_with(v_me, p_user, null) then raise exception 'not allowed' using errcode = '42501'; end if;
 insert into public.business_invitations(business_id, user_id, role, invited_by, job_title, duties, rate, rate_unit)
 values (p_business, p_user, p_role, v_me, nullif(trim(coalesce(p_title, '')), ''), nullif(trim(coalesce(p_duties, '')), ''), p_rate, case when p_rate is null then null else coalesce(p_unit, 'hour') end)
 returning id into v_id;
 perform public.notify(p_user, 'Company invitation', b.name, '/app/profile/companies/invites');
 return v_id;
exception when unique_violation then
 return null;
end;$$;
revoke execute on function public.invite_to_business(uuid, uuid, text, text, text, numeric, text) from public, anon;
grant execute on function public.invite_to_business(uuid, uuid, text, text, text, numeric, text) to authenticated;

create or replace function public.answer_business_invitation(p_invitation uuid, p_accept boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); i record; b record; v_conv uuid; v_name text;
begin
 select * into i from public.business_invitations where id = p_invitation and user_id = v_me and status = 'pending' for update;
 if i.id is null then raise exception 'invitation not found' using errcode = 'no_data_found'; end if;
 update public.business_invitations set status = case when p_accept then 'accepted' else 'declined' end, answered_at = now() where id = i.id;
 if not p_accept then return null; end if;
 select * into b from public.businesses where id = i.business_id;
 insert into public.business_members(business_id, user_id, role, job_title, duties, rate, rate_unit, starts_on)
 values (i.business_id, v_me, i.role, i.job_title, i.duties, i.rate, i.rate_unit, current_date) on conflict do nothing;
 v_conv := public.ensure_business_chat(i.business_id);
 insert into public.conversation_members(conversation_id, user_id) values (v_conv, v_me) on conflict do nothing;
 select display_name into v_name from public.profiles where id = v_me;
 perform public.notify(i.invited_by, 'Company joined', coalesce(v_name, '') || ' · ' || b.name, '/app/profile/companies/' || i.business_id);
 return i.business_id;
end;$$;

drop function public.business_team(uuid);
create function public.business_team(p_business uuid) returns table(user_id uuid, display_name text, avatar_url text, role text, job_title text)
language sql stable security definer set search_path='' as $$
 select m.user_id, p.display_name, p.avatar_url, m.role, m.job_title
 from public.business_members m join public.profiles p on p.id = m.user_id
 where m.business_id = p_business
   and exists (select 1 from public.business_members me where me.business_id = p_business and me.user_id = (select auth.uid()))
 order by case m.role when 'owner' then 0 when 'manager' then 1 else 2 end, p.display_name
$$;
grant execute on function public.business_team(uuid) to authenticated;

create function public.business_terms(p_business uuid) returns table(user_id uuid, job_title text, duties text, rate numeric, rate_unit text, starts_on date)
language sql stable security definer set search_path='' as $$
 select m.user_id, m.job_title, m.duties, m.rate, m.rate_unit, m.starts_on
 from public.business_members m
 where m.business_id = p_business and (m.user_id = (select auth.uid()) or public.is_business_owner(p_business))
$$;
grant execute on function public.business_terms(uuid) to authenticated;

create function public.set_member_terms(p_business uuid, p_user uuid, p_title text, p_duties text, p_rate numeric, p_unit text) returns void
language plpgsql security definer set search_path='' as $$
declare b record;
begin
 select * into b from public.businesses where id = p_business and owner_id = (select auth.uid());
 if b.id is null then raise exception 'not allowed' using errcode = '42501'; end if;
 if p_unit is not null and p_unit not in ('hour','day','month') then raise exception 'unknown unit' using errcode = 'check_violation'; end if;
 update public.business_members set job_title = nullif(trim(coalesce(p_title, '')), ''), duties = nullif(trim(coalesce(p_duties, '')), ''),
   rate = p_rate, rate_unit = case when p_rate is null then null else coalesce(p_unit, 'hour') end
  where business_id = p_business and user_id = p_user;
 if p_user <> b.owner_id then perform public.notify(p_user, 'Terms updated', b.name, '/app/profile/companies/' || p_business || '/terms'); end if;
end;$$;
revoke execute on function public.set_member_terms(uuid, uuid, text, text, numeric, text) from public, anon;
grant execute on function public.set_member_terms(uuid, uuid, text, text, numeric, text) to authenticated;


-- Pay records: what is owed and what was paid. Private to the owner and the person. No money moves.
create table public.pay_records (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 period_from date not null,
 period_to date not null,
 quantity numeric(8,2) not null check (quantity > 0 and quantity <= 1000),
 unit text not null check (unit in ('hour','day','month')),
 rate numeric(10,2) not null check (rate >= 0),
 amount numeric(12,2) not null check (amount >= 0),
 status text not null default 'owed' check (status in ('owed','paid')),
 paid_on date,
 note text check (note is null or length(note) <= 300),
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 check (period_to >= period_from)
);
create index pay_records_business_idx on public.pay_records(business_id, user_id, period_from desc);
alter table public.pay_records enable row level security;
create policy pay_records_read on public.pay_records for select to authenticated
 using (user_id = (select auth.uid()) or public.is_business_owner(business_id));

create function public.add_pay_record(p_business uuid, p_user uuid, p_from date, p_to date, p_quantity numeric, p_note text) returns uuid
language plpgsql security definer set search_path='' as $$
declare b record; m record; v_id uuid;
begin
 select * into b from public.businesses where id = p_business and owner_id = (select auth.uid());
 if b.id is null then raise exception 'not allowed' using errcode = '42501'; end if;
 select * into m from public.business_members where business_id = p_business and user_id = p_user;
 if m.user_id is null or p_user = b.owner_id then raise exception 'not a team member' using errcode = 'check_violation'; end if;
 if m.rate is null or m.rate_unit is null then raise exception 'set the rate first' using errcode = 'check_violation'; end if;
 insert into public.pay_records(business_id, user_id, period_from, period_to, quantity, unit, rate, amount, note, created_by)
 values (p_business, p_user, p_from, p_to, p_quantity, m.rate_unit, m.rate, round(p_quantity * m.rate, 2), nullif(trim(coalesce(p_note, '')), ''), (select auth.uid()))
 returning id into v_id;
 perform public.notify(p_user, 'Pay recorded', b.name || ' · ' || round(p_quantity * m.rate, 2), '/app/profile/companies/' || p_business || '/terms');
 return v_id;
end;$$;
revoke execute on function public.add_pay_record(uuid, uuid, date, date, numeric, text) from public, anon;
grant execute on function public.add_pay_record(uuid, uuid, date, date, numeric, text) to authenticated;

create function public.mark_pay_paid(p_record uuid, p_paid_on date, p_note text) returns void
language plpgsql security definer set search_path='' as $$
declare r record; b record;
begin
 select * into r from public.pay_records where id = p_record and status = 'owed';
 select * into b from public.businesses where id = r.business_id and owner_id = (select auth.uid());
 if r.id is null or b.id is null then raise exception 'not allowed' using errcode = '42501'; end if;
 update public.pay_records set status = 'paid', paid_on = coalesce(p_paid_on, current_date), note = coalesce(nullif(trim(coalesce(p_note, '')), ''), note) where id = p_record;
 perform public.notify(r.user_id, 'Pay marked as paid', b.name || ' · ' || r.amount, '/app/profile/companies/' || r.business_id || '/terms');
end;$$;
revoke execute on function public.mark_pay_paid(uuid, date, text) from public, anon;
grant execute on function public.mark_pay_paid(uuid, date, text) to authenticated;

create function public.delete_pay_record(p_record uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 delete from public.pay_records r
 where r.id = p_record and r.status = 'owed' and exists (select 1 from public.businesses b where b.id = r.business_id and b.owner_id = (select auth.uid()));
end;$$;
revoke execute on function public.delete_pay_record(uuid) from public, anon;
grant execute on function public.delete_pay_record(uuid) to authenticated;

create or replace function public.notification_title_km(p_title text) returns text language sql immutable set search_path='' as $
 select case p_title
  when 'New quote' then 'សម្រង់តម្លៃថ្មី'
  when 'Quote accepted' then 'សម្រង់តម្លៃត្រូវបានទទួលយក'
  when 'Quote declined' then 'សម្រង់តម្លៃត្រូវបានបដិសេធ'
  when 'Work delivered' then 'ការងារបានប្រគល់'
  when 'Job confirmed' then 'ការងារបានបញ្ជាក់'
  when 'Job cancelled' then 'ការងារត្រូវបានលុបចោល'
  when 'New review' then 'ការវាយតម្លៃថ្មី'
  when 'New message' then 'សារថ្មី'
  when 'New comment' then 'មតិថ្មី'
  when 'New application' then 'ការដាក់ពាក្យថ្មី'
  when 'Dispute opened' then 'វិវាទត្រូវបានបើក'
  when 'Dispute resolved' then 'វិវាទបានដោះស្រាយ'
  when 'Dispute dismissed' then 'វិវាទត្រូវបានបដិសេធ'
  when 'Dispute reviewing' then 'វិវាទកំពុងពិនិត្យ'
  when 'Identity checked' then 'អត្តសញ្ញាណបានត្រួតពិនិត្យ'
  when 'Identity check rejected' then 'អត្តសញ្ញាណត្រូវបានបដិសេធ'
  when 'Project invitation' then 'ការអញ្ជើញឱ្យធ្វើគម្រោង'
  when 'Message request' then 'សំណើផ្ញើសារ'
  when 'Request accepted' then 'សំណើត្រូវបានទទួលយក'
  when 'Added to a group' then 'បានបន្ថែមទៅក្រុម'
  when 'Activity joined' then 'មានអ្នកចូលរួមសកម្មភាព'
  when 'Activity spot' then 'មានកន្លែងទំនេរក្នុងសកម្មភាព'
  when 'Activity cancelled' then 'សកម្មភាពត្រូវបានលុបចោល'
  when 'Hours confirmed' then 'ម៉ោងស្ម័គ្រចិត្តត្រូវបានបញ្ជាក់'
  when 'Quote waiting' then 'សម្រង់តម្លៃកំពុងរង់ចាំចម្លើយ'
  when 'Confirm the work' then 'សូមបញ្ជាក់ការងារ'
  when 'Deadline tomorrow' then 'ថ្ងៃស្អែកគឺកំណត់ពេល'
  when 'Availability ends soon' then 'ភាពទំនេរជិតផុតកំណត់'
  when 'Hire again?' then 'ជួលម្តងទៀតទេ?'
  when 'Activity reminder' then 'ការរំលឹកសកម្មភាព'
  when 'Job alert' then 'ការជូនដំណឹងការងារ'
  when 'New identity check' then 'ការពិនិត្យអត្តសញ្ញាណថ្មី'
  when 'New report' then 'របាយការណ៍ថ្មី'
  when 'New dispute' then 'វិវាទថ្មី'
  when 'New project request' then 'សំណើគម្រោងថ្មី'
  when 'New provider application' then 'ពាក្យសុំអ្នកផ្តល់សេវាថ្មី'
  when 'Company invitation' then 'ការអញ្ជើញចូលក្រុមហ៊ុន'
  when 'Company joined' then 'បានចូលក្រុមហ៊ុន'
  when 'Terms updated' then 'លក្ខខណ្ឌការងារត្រូវបានកែ'
  when 'Pay recorded' then 'បានកត់ត្រាប្រាក់ឈ្នួល'
  when 'Pay marked as paid' then 'ប្រាក់ឈ្នួលត្រូវបានកត់ថាបានបង់'
  else p_title end
$$;

commit;
