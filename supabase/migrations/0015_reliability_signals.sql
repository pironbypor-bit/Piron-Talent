-- Piron Talent | migration 0015 | reliability signals: "Available this week" and measured reply time
-- Run after 0014_fix_quotes_add_policy.sql in the Supabase SQL editor.
begin;

-- 1. Available this week: a timestamp, so the switch turns itself off after seven days.
alter table public.profiles add column available_until timestamptz;
create index profiles_available_until_idx on public.profiles(available_until) where available_until is not null;

create function public.set_available_this_week(p_on boolean) returns void language sql security definer set search_path='' as $$
 update public.profiles set available_until = case when p_on then now() + interval '7 days' else null end where id = (select auth.uid())
$$;
revoke execute on function public.set_available_this_week(boolean) from public, anon;
grant execute on function public.set_available_this_week(boolean) to authenticated;

-- 2. Reply time, measured: for each message the provider received, the delay until their next message in that
--    conversation; plus, for invited posts, the delay from the invitation to the provider's quote. Last 90 days, median.
create function public.provider_signals(p_ids uuid[])
returns table(provider_id uuid, reply_minutes integer, replies integer)
language sql stable security definer set search_path='' as $$
 with inbound as (
  select cm.user_id as provider_id, m.conversation_id, m.created_at as asked_at
  from public.messages m
  join public.conversation_members cm on cm.conversation_id = m.conversation_id and cm.user_id <> m.sender_id
  where cm.user_id = any(p_ids) and m.created_at > now() - interval '90 days'
 ),
 answered as (
  select i.provider_id,
         (select min(r.created_at) from public.messages r
           where r.conversation_id = i.conversation_id and r.sender_id = i.provider_id and r.created_at > i.asked_at) as replied_at,
         i.asked_at
  from inbound i
 ),
 invites as (
  select p.invited_provider_id as provider_id, p.created_at as asked_at, q.created_at as replied_at
  from public.posts p
  join public.quotes q on q.post_id = p.id and q.provider_id = p.invited_provider_id
  where p.invited_provider_id = any(p_ids) and p.created_at > now() - interval '90 days'
 ),
 all_replies as (
  select provider_id, extract(epoch from (replied_at - asked_at)) / 60 as minutes from answered where replied_at is not null
  union all
  select provider_id, extract(epoch from (replied_at - asked_at)) / 60 from invites
 )
 select provider_id,
        (percentile_cont(0.5) within group (order by minutes))::integer as reply_minutes,
        count(*)::integer as replies
 from all_replies
 group by provider_id
$$;
revoke execute on function public.provider_signals(uuid[]) from public;
grant execute on function public.provider_signals(uuid[]) to anon, authenticated;

commit;
