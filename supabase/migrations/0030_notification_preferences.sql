-- Piron Work | migration 0030 | per-type notification preferences (notification plan step 6, 2026-10-14)
-- Run after 0029_owner_alerts.sql in the Supabase SQL editor.
-- A muted group never reaches the bell, the phone or email: a BEFORE INSERT trigger on notifications drops the row.
-- It is named so it fires before the email trigger (triggers fire in name order).
-- Always on: identity results, disputes, owner alerts, job alerts, and the reminders group which has its own switch.
begin;

alter table public.profile_private add column muted_groups text[] not null default '{}';

create function public.set_notification_group(p_group text, p_on boolean) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid());
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if p_group not in ('projects', 'messages', 'activities', 'reviews') then raise exception 'unknown group' using errcode = 'check_violation'; end if;
 insert into public.profile_private(user_id, muted_groups) values (v_me, case when p_on then '{}'::text[] else array[p_group] end)
 on conflict (user_id) do update set muted_groups =
  case when p_on then array_remove(public.profile_private.muted_groups, p_group)
       else array_append(array_remove(public.profile_private.muted_groups, p_group), p_group) end;
end;$$;
revoke execute on function public.set_notification_group(text, boolean) from public, anon;
grant execute on function public.set_notification_group(text, boolean) to authenticated;

create function public.notification_group(p_title text) returns text language sql immutable set search_path='' as $$
 select case
  when p_title in ('New quote', 'Quote accepted', 'Quote declined', 'Work delivered', 'Job confirmed', 'Job cancelled', 'Project invitation', 'New application') then 'projects'
  when p_title in ('New message', 'Message request', 'Request accepted', 'Added to a group', 'New comment') then 'messages'
  when p_title in ('Activity joined', 'Activity spot', 'Activity cancelled', 'Hours confirmed') then 'activities'
  when p_title = 'New review' then 'reviews'
  else null end
$$;

create function public.notifications_apply_prefs() returns trigger language plpgsql security definer set search_path='' as $$
declare g text := public.notification_group(new.title);
begin
 if g is not null and exists (select 1 from public.profile_private where user_id = new.user_id and g = any(muted_groups)) then
  return null;
 end if;
 return new;
end;$$;
create trigger notifications_a_prefs before insert on public.notifications for each row execute function public.notifications_apply_prefs();

commit;
