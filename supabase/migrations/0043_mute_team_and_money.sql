-- Piron Work | migration 0043 | two more groups people can mute: team work, and invoices and pay
-- Run after 0042_members_only_shift_task_actions.sql.
begin;

create or replace function public.set_notification_group(p_group text, p_on boolean) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid());
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if p_group not in ('projects', 'messages', 'activities', 'reviews', 'team', 'money') then raise exception 'unknown group' using errcode = 'check_violation'; end if;
 insert into public.profile_private(user_id, muted_groups) values (v_me, case when p_on then '{}'::text[] else array[p_group] end)
 on conflict (user_id) do update set muted_groups =
  case when p_on then array_remove(public.profile_private.muted_groups, p_group)
       else array_append(array_remove(public.profile_private.muted_groups, p_group), p_group) end;
end;$$;

create or replace function public.notification_group(p_title text) returns text language sql immutable set search_path='' as $$
 select case
  when p_title in ('New quote', 'Quote accepted', 'Quote declined', 'Work delivered', 'Job confirmed', 'Job cancelled', 'Project invitation', 'New application') then 'projects'
  when p_title in ('New message', 'Message request', 'Request accepted', 'Added to a group', 'New comment') then 'messages'
  when p_title in ('Activity joined', 'Activity spot', 'Activity cancelled', 'Hours confirmed') then 'activities'
  when p_title = 'New review' then 'reviews'
  when p_title in ('Shift scheduled', 'Shift cancelled', 'Task assigned', 'Task done') then 'team'
  when p_title in ('Invoice received', 'Payment marked as paid', 'Payment received', 'Payment not received', 'Invoice cancelled',
                   'Pay recorded', 'Pay marked as paid', 'Terms updated', 'Payout account approved', 'Payout account rejected') then 'money'
  else null end
$$;

commit;
