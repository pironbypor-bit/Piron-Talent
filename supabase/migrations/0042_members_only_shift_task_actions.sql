-- Piron Work | migration 0042 | a person removed from a company can no longer act on its shifts and tasks
-- Run after 0041_notification_titles_km.sql. Found in the review of 2026-10-15: set_task_status and clock_shift only
-- looked at the assignment or the shift owner, so a former member could still change a task or clock a shift.
begin;

create or replace function public.set_task_status(p_task uuid, p_status text) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); t record;
begin
 if p_status not in ('todo','doing','done') then raise exception 'bad status' using errcode = '22023'; end if;
 select * into t from public.team_tasks where id = p_task;
 if t.id is null or not (
   (coalesce(t.assignee_id = v_me, false) and exists (select 1 from public.business_members m where m.business_id = t.business_id and m.user_id = v_me))
   or public.is_business_manager(t.business_id)) then
  raise exception 'not allowed' using errcode = '42501';
 end if;
 update public.team_tasks set status = p_status, done_at = case when p_status = 'done' then now() else null end where id = p_task;
 if p_status = 'done' and t.created_by <> v_me then
  perform public.notify(t.created_by, 'Task done', left(t.title, 100), '/app/profile/companies/' || t.business_id || '/tasks');
 end if;
end;$$;

create or replace function public.clock_shift(p_shift uuid, p_action text) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); s record; v_mgr boolean;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if p_action not in ('in','out','absent','reset') then raise exception 'bad action' using errcode = '22023'; end if;
 select * into s from public.team_shifts where id = p_shift for update;
 if s.id is null then raise exception 'not found' using errcode = 'no_data_found'; end if;
 v_mgr := public.is_business_manager(s.business_id);
 if not v_mgr and (s.user_id <> v_me or not exists (select 1 from public.business_members m where m.business_id = s.business_id and m.user_id = v_me)) then
  raise exception 'not allowed' using errcode = '42501';
 end if;
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

commit;
