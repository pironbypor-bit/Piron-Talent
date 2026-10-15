-- Piron Work | migration 0037 | team shifts (schedule, clock in and out) and shared tasks
-- Run after 0036_works_at.sql. Owner and managers plan shifts and tasks; a member sees and acts only on their own.
-- Records only: hours worked can inform a pay record (0032) but nothing is calculated or paid here.
begin;

create table public.team_shifts (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 note text check (note is null or length(note) <= 200),
 clock_in_at timestamptz,
 clock_out_at timestamptz,
 absent boolean not null default false,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 check (ends_at > starts_at and ends_at <= starts_at + interval '16 hours')
);
create index team_shifts_business_idx on public.team_shifts(business_id, starts_at);
create index team_shifts_user_idx on public.team_shifts(user_id, starts_at);
alter table public.team_shifts enable row level security;
create policy team_shifts_read on public.team_shifts for select to authenticated
 using (public.is_business_manager(business_id) or user_id = (select auth.uid()));

create table public.team_tasks (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 title text not null check (length(title) between 2 and 120),
 detail text check (detail is null or length(detail) <= 500),
 assignee_id uuid references public.profiles(id) on delete set null,
 status text not null default 'todo' check (status in ('todo','doing','done')),
 due_on date,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 done_at timestamptz
);
create index team_tasks_business_idx on public.team_tasks(business_id, created_at desc);
alter table public.team_tasks enable row level security;
create policy team_tasks_read on public.team_tasks for select to authenticated
 using (public.is_business_manager(business_id) or assignee_id = (select auth.uid()));

create function public.add_team_shift(p_business uuid, p_user uuid, p_starts timestamptz, p_ends timestamptz, p_note text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_id uuid;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if not public.is_business_manager(p_business) then raise exception 'not allowed' using errcode = '42501'; end if;
 if not exists (select 1 from public.business_members where business_id = p_business and user_id = p_user) then raise exception 'not a member' using errcode = '22023'; end if;
 if p_ends <= p_starts or p_ends > p_starts + interval '16 hours' then raise exception 'bad times' using errcode = '22023'; end if;
 if exists (select 1 from public.team_shifts s where s.business_id = p_business and s.user_id = p_user and s.starts_at < p_ends and s.ends_at > p_starts) then
  raise exception 'overlap' using errcode = 'check_violation';
 end if;
 if (select count(*) from public.team_shifts where business_id = p_business and starts_at > now() - interval '1 day') >= 600 then raise exception 'too many shifts' using errcode = 'check_violation'; end if;
 insert into public.team_shifts(business_id, user_id, starts_at, ends_at, note, created_by)
 values (p_business, p_user, p_starts, p_ends, nullif(left(trim(coalesce(p_note, '')), 200), ''), v_me) returning id into v_id;
 if p_user <> v_me then
  perform public.notify(p_user, 'Shift scheduled', to_char(p_starts at time zone 'Asia/Phnom_Penh', 'Dy DD Mon HH24:MI') || ' - ' || to_char(p_ends at time zone 'Asia/Phnom_Penh', 'HH24:MI'), '/app/profile/companies/' || p_business || '/schedule');
 end if;
 return v_id;
end;$$;

create function public.delete_team_shift(p_shift uuid) returns void
language plpgsql security definer set search_path='' as $$
declare s record;
begin
 select * into s from public.team_shifts where id = p_shift;
 if s.id is null or not public.is_business_manager(s.business_id) then raise exception 'not allowed' using errcode = '42501'; end if;
 delete from public.team_shifts where id = p_shift;
 if s.user_id <> (select auth.uid()) and s.starts_at > now() then
  perform public.notify(s.user_id, 'Shift cancelled', to_char(s.starts_at at time zone 'Asia/Phnom_Penh', 'Dy DD Mon HH24:MI'), '/app/profile/companies/' || s.business_id || '/schedule');
 end if;
end;$$;

-- A member clocks in from 30 minutes before the start until the end, and out after clocking in.
-- Owner and managers can correct anyone's shift at any time.
create function public.clock_shift(p_shift uuid, p_action text) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); s record; v_mgr boolean;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if p_action not in ('in','out','absent','reset') then raise exception 'bad action' using errcode = '22023'; end if;
 select * into s from public.team_shifts where id = p_shift for update;
 if s.id is null then raise exception 'not found' using errcode = 'no_data_found'; end if;
 v_mgr := public.is_business_manager(s.business_id);
 if not v_mgr and s.user_id <> v_me then raise exception 'not allowed' using errcode = '42501'; end if;
 if p_action = 'reset' and not v_mgr then raise exception 'not allowed' using errcode = '42501'; end if;
 if p_action = 'in' then
  if not v_mgr and (now() < s.starts_at - interval '30 minutes' or now() > s.ends_at) then raise exception 'outside the shift time' using errcode = 'check_violation'; end if;
  update public.team_shifts set clock_in_at = coalesce(clock_in_at, now()), absent = false where id = p_shift;
 elsif p_action = 'out' then
  if s.clock_in_at is null then raise exception 'clock in first' using errcode = 'check_violation'; end if;
  update public.team_shifts set clock_out_at = coalesce(clock_out_at, now()) where id = p_shift;
 elsif p_action = 'absent' then
  update public.team_shifts set absent = true, clock_in_at = null, clock_out_at = null where id = p_shift;
 else
  update public.team_shifts set absent = false, clock_in_at = null, clock_out_at = null where id = p_shift;
 end if;
end;$$;

create function public.add_team_task(p_business uuid, p_title text, p_detail text, p_assignee uuid, p_due date) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_id uuid;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if not public.is_business_manager(p_business) then raise exception 'not allowed' using errcode = '42501'; end if;
 if p_assignee is not null and not exists (select 1 from public.business_members where business_id = p_business and user_id = p_assignee) then raise exception 'not a member' using errcode = '22023'; end if;
 if (select count(*) from public.team_tasks where business_id = p_business and status <> 'done') >= 200 then raise exception 'too many tasks' using errcode = 'check_violation'; end if;
 insert into public.team_tasks(business_id, title, detail, assignee_id, due_on, created_by)
 values (p_business, trim(p_title), nullif(left(trim(coalesce(p_detail, '')), 500), ''), p_assignee, p_due, v_me) returning id into v_id;
 if p_assignee is not null and p_assignee <> v_me then
  perform public.notify(p_assignee, 'Task assigned', left(trim(p_title), 100), '/app/profile/companies/' || p_business || '/tasks');
 end if;
 return v_id;
end;$$;

create function public.set_task_status(p_task uuid, p_status text) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); t record;
begin
 if p_status not in ('todo','doing','done') then raise exception 'bad status' using errcode = '22023'; end if;
 select * into t from public.team_tasks where id = p_task;
 if t.id is null or not (t.assignee_id = v_me or public.is_business_manager(t.business_id)) then raise exception 'not allowed' using errcode = '42501'; end if;
 update public.team_tasks set status = p_status, done_at = case when p_status = 'done' then now() else null end where id = p_task;
 if p_status = 'done' and t.created_by <> v_me then
  perform public.notify(t.created_by, 'Task done', left(t.title, 100), '/app/profile/companies/' || t.business_id || '/tasks');
 end if;
end;$$;

create function public.delete_team_task(p_task uuid) returns void
language plpgsql security definer set search_path='' as $$
declare t record;
begin
 select * into t from public.team_tasks where id = p_task;
 if t.id is null or not public.is_business_manager(t.business_id) then raise exception 'not allowed' using errcode = '42501'; end if;
 delete from public.team_tasks where id = p_task;
end;$$;

revoke execute on function public.add_team_shift(uuid, uuid, timestamptz, timestamptz, text) from public, anon;
revoke execute on function public.delete_team_shift(uuid) from public, anon;
revoke execute on function public.clock_shift(uuid, text) from public, anon;
revoke execute on function public.add_team_task(uuid, text, text, uuid, date) from public, anon;
revoke execute on function public.set_task_status(uuid, text) from public, anon;
revoke execute on function public.delete_team_task(uuid) from public, anon;
grant execute on function public.add_team_shift(uuid, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.delete_team_shift(uuid) to authenticated;
grant execute on function public.clock_shift(uuid, text) to authenticated;
grant execute on function public.add_team_task(uuid, text, text, uuid, date) to authenticated;
grant execute on function public.set_task_status(uuid, text) to authenticated;
grant execute on function public.delete_team_task(uuid) to authenticated;

commit;
