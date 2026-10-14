-- Piron Work | migration 0026 | files in messages and blocking (people plan, 2026-10-14)
-- Run after 0025_volunteer_activities.sql in the Supabase SQL editor.
begin;

-- 1. Files in messages: a private bucket, readable only by the people in the conversation named by the first folder.
alter table public.messages
 add column attachment_path text check (attachment_path is null or length(attachment_path) <= 300),
 add column attachment_type text check (attachment_type is null or attachment_type in ('image/jpeg','image/png','image/webp','application/pdf'));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('message-files', 'message-files', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create function public.can_use_message_path(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select case when (storage.foldername(p_name))[1] ~ '^[0-9a-f-]{36}$'
  then exists (select 1 from public.conversation_members m
               where m.conversation_id = ((storage.foldername(p_name))[1])::uuid and m.user_id = (select auth.uid()))
  else false end
$$;
grant execute on function public.can_use_message_path(text) to authenticated;
create policy message_files_add on storage.objects for insert to authenticated
 with check (bucket_id = 'message-files' and public.can_use_message_path(name));
create policy message_files_read on storage.objects for select to authenticated
 using (bucket_id = 'message-files' and public.can_use_message_path(name));

-- 2. Blocking. Nobody is told. A block works in both directions for private messages, requests, invitations and groups.
create table public.user_blocks (
 blocker_id uuid not null references public.profiles(id) on delete cascade,
 blocked_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (blocker_id, blocked_id),
 check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
create policy user_blocks_own_read on public.user_blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy user_blocks_own_add on public.user_blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy user_blocks_own_delete on public.user_blocks for delete to authenticated using (blocker_id = (select auth.uid()));

create function public.blocked_between(a uuid, b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.user_blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a))
$$;
revoke execute on function public.blocked_between(uuid, uuid) from public, anon, authenticated;

-- Is this private conversation blocked in either direction? Groups are never blocked as a whole.
create function public.chat_blocked(p_conv uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id
  join public.conversation_members b on b.conversation_id = c.id and b.user_id <> a.user_id
  where c.id = p_conv and c.kind = 'direct' and public.blocked_between(a.user_id, b.user_id))
$$;
grant execute on function public.chat_blocked(uuid) to authenticated;

drop policy messages_send on public.messages;
create policy messages_send on public.messages for insert to authenticated
 with check (sender_id = (select auth.uid()) and public.is_conversation_member(conversation_id) and not public.chat_blocked(conversation_id));

-- Starting a conversation, saying hello, grouping and inviting all refuse a blocked pair.
create or replace function public.start_conversation(p_user uuid, p_body text, p_post uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_conv uuid;
begin
 if v_me is null then raise exception 'sign in first' using errcode='42501'; end if;
 if p_user = v_me then raise exception 'cannot message yourself' using errcode='check_violation'; end if;
 if p_body is null or length(trim(p_body)) = 0 or length(p_body) > 3000 then
  raise exception 'message is empty or too long' using errcode='check_violation';
 end if;
 if public.blocked_between(v_me, p_user) then raise exception 'this person is not open to messages' using errcode='42501'; end if;
 select c.id into v_conv from public.conversations c
  join public.conversation_members a on a.conversation_id=c.id and a.user_id=v_me
  join public.conversation_members b on b.conversation_id=c.id and b.user_id=p_user
  where c.kind = 'direct'
  limit 1;
 if v_conv is null then
  if not (exists(select 1 from public.posts p where p.id=p_post and p.author_id=p_user and p.status='published')
       or exists(select 1 from public.profiles pr where pr.id=p_user and pr.is_available)) then
   raise exception 'this person is not open to messages' using errcode='42501';
  end if;
  insert into public.conversations default values returning id into v_conv;
  insert into public.conversation_members(conversation_id, user_id) values (v_conv, v_me), (v_conv, p_user);
 end if;
 insert into public.messages(conversation_id, sender_id, body) values (v_conv, v_me, p_body);
 return v_conv;
end;$$;

create or replace function public.contact_state(p_user uuid) returns table(state text, conv_id uuid)
language plpgsql stable security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_conv uuid;
begin
 if v_me is null then return query select 'anon'::text, null::uuid; return; end if;
 if p_user = v_me then return query select 'self'::text, null::uuid; return; end if;
 if public.blocked_between(v_me, p_user) then return query select 'declined'::text, null::uuid; return; end if;
 select c.id into v_conv from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = v_me
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_user
  where c.kind = 'direct'
  limit 1;
 if v_conv is not null then return query select 'conversation'::text, v_conv; return; end if;
 if exists (select 1 from public.profiles pr where pr.id = p_user and pr.is_available) then return query select 'open'::text, null::uuid; return; end if;
 if exists (select 1 from public.message_requests r where r.from_user = v_me and r.to_user = p_user and r.status = 'pending') then return query select 'pending'::text, null::uuid; return; end if;
 if exists (select 1 from public.message_requests r where r.from_user = p_user and r.to_user = v_me and r.status = 'pending') then return query select 'incoming'::text, null::uuid; return; end if;
 if exists (select 1 from public.message_requests r where r.from_user = v_me and r.to_user = p_user and r.status = 'declined' and r.answered_at > now() - interval '30 days') then return query select 'declined'::text, null::uuid; return; end if;
 return query select 'can_request'::text, null::uuid;
end;$$;

create or replace function public.can_group_with(p_me uuid, p_user uuid, p_post uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select not public.blocked_between(p_me, p_user) and (
   exists (select 1 from public.conversations c
         join public.conversation_members a on a.conversation_id = c.id and a.user_id = p_me
         join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_user
         where c.kind = 'direct')
     or (p_post is not null and exists (select 1 from public.posts p join public.quotes q on q.post_id = p.id
         where p.id = p_post and p.author_id = p_me and q.provider_id = p_user and q.status in ('pending','accepted'))))
$$;

create or replace function public.invite_providers(p_post uuid, p_providers uuid[]) returns integer
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); p record; u uuid; n integer := 0; v_total integer; v_today integer;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 select id, title, author_id, kind, status into p from public.posts where id = p_post;
 if p.id is null or p.author_id <> v_me or p.kind <> 'need_help' or p.status <> 'published' then
  raise exception 'not allowed' using errcode = '42501';
 end if;
 if public.post_has_active_job(p_post) then raise exception 'already hired' using errcode = 'check_violation'; end if;
 select count(*) into v_total from public.post_invitations where post_id = p_post;
 select count(*) into v_today from public.post_invitations where invited_by = v_me and created_at > now() - interval '1 day';
 foreach u in array coalesce((select array_agg(distinct x) from unnest(p_providers) x where x is not null and x <> v_me), '{}'::uuid[]) loop
  exit when n >= 10 or v_total + n >= 20 or v_today + n >= 20;
  if public.blocked_between(v_me, u) then continue; end if;
  if exists (select 1 from public.post_invitations where post_id = p_post and provider_id = u) then continue; end if;
  if not (exists (select 1 from public.profiles where id = u and is_available) or public.can_group_with(v_me, u, null)) then continue; end if;
  insert into public.post_invitations(post_id, provider_id, invited_by) values (p_post, u, v_me);
  perform public.notify(u, 'Project invitation', p.title, '/app/post/' || p_post);
  n := n + 1;
 end loop;
 return n;
end;$$;

commit;
