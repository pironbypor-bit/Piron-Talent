-- Piron Work | migration 0038 | fix: a member could change the status of an unassigned task
-- Run after 0037_team_shifts_tasks.sql. "assignee_id = me" is null for an unassigned task, and "not null" passed the check.
begin;

create or replace function public.set_task_status(p_task uuid, p_status text) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); t record;
begin
 if p_status not in ('todo','doing','done') then raise exception 'bad status' using errcode = '22023'; end if;
 select * into t from public.team_tasks where id = p_task;
 if t.id is null or not (coalesce(t.assignee_id = v_me, false) or public.is_business_manager(t.business_id)) then raise exception 'not allowed' using errcode = '42501'; end if;
 update public.team_tasks set status = p_status, done_at = case when p_status = 'done' then now() else null end where id = p_task;
 if p_status = 'done' and t.created_by <> v_me then
  perform public.notify(t.created_by, 'Task done', left(t.title, 100), '/app/profile/companies/' || t.business_id || '/tasks');
 end if;
end;$$;

commit;
