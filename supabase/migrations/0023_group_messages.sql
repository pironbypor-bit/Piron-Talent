-- Piron Work | migration 0023 | group messages (people plan, 2026-10-14)
-- Run after 0022_message_requests.sql in the Supabase SQL editor.
-- Rule: you can add only people you already talk with, or (on your own project) providers who sent you a quote.
-- Direct conversations stay one-to-one: the functions that look for "the conversation between two people" now
-- look only at kind = 'direct', so a shared group never swallows a private message.
begin;

alter table public.conversations
 add column kind text not null default 'direct' check (kind in ('direct','group')),
 add column title text check (title is null or length(title) between 2 and 80),
 add column created_by uuid references public.profiles(id) on delete set null,
 add column post_id uuid references public.posts(id) on delete set null;
alter table public.conversation_members add column role text not null default 'member' check (role in ('owner','member'));

create function public.can_group_with(p_me uuid, p_user uuid, p_post uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.conversations c
         join public.conversation_members a on a.conversation_id = c.id and a.user_id = p_me
         join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_user
         where c.kind = 'direct')
     or (p_post is not null and exists (select 1 from public.posts p join public.quotes q on q.post_id = p.id
         where p.id = p_post and p.author_id = p_me and q.provider_id = p_user and q.status in ('pending','accepted')))
$$;
revoke execute on function public.can_group_with(uuid, uuid, uuid) from public, anon, authenticated;

create function public.create_group(p_title text, p_members uuid[], p_post uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_conv uuid; u uuid; n integer := 0; v_title text := trim(coalesce(p_title, ''));
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if length(v_title) < 2 or length(v_title) > 80 then raise exception 'title' using errcode = 'check_violation'; end if;
 if p_post is not null and not exists (select 1 from public.posts where id = p_post and author_id = v_me) then
  raise exception 'not your project' using errcode = '42501';
 end if;
 insert into public.conversations(kind, title, created_by, post_id) values ('group', v_title, v_me, p_post) returning id into v_conv;
 insert into public.conversation_members(conversation_id, user_id, role) values (v_conv, v_me, 'owner');
 foreach u in array coalesce((select array_agg(distinct x) from unnest(p_members) x where x is not null and x <> v_me), '{}'::uuid[]) loop
  exit when n >= 19;
  if public.can_group_with(v_me, u, p_post) then
   insert into public.conversation_members(conversation_id, user_id) values (v_conv, u) on conflict do nothing;
   perform public.notify(u, 'Added to a group', v_title, '/app/messages/' || v_conv);
   n := n + 1;
  end if;
 end loop;
 if n = 0 then raise exception 'no one to add' using errcode = 'check_violation'; end if;
 return v_conv;
end;$$;
revoke execute on function public.create_group(text, uuid[], uuid) from public, anon;
grant execute on function public.create_group(text, uuid[], uuid) to authenticated;

create function public.add_group_members(p_conv uuid, p_members uuid[]) returns integer
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); c record; u uuid; n integer := 0; total integer;
begin
 select * into c from public.conversations where id = p_conv and kind = 'group';
 if c.id is null or not exists (select 1 from public.conversation_members where conversation_id = p_conv and user_id = v_me and role = 'owner') then
  raise exception 'not allowed' using errcode = '42501';
 end if;
 select count(*) into total from public.conversation_members where conversation_id = p_conv;
 foreach u in array coalesce((select array_agg(distinct x) from unnest(p_members) x where x is not null and x <> v_me), '{}'::uuid[]) loop
  exit when total + n >= 20;
  if not exists (select 1 from public.conversation_members where conversation_id = p_conv and user_id = u)
     and public.can_group_with(v_me, u, c.post_id) then
   insert into public.conversation_members(conversation_id, user_id) values (p_conv, u);
   perform public.notify(u, 'Added to a group', c.title, '/app/messages/' || p_conv);
   n := n + 1;
  end if;
 end loop;
 return n;
end;$$;
revoke execute on function public.add_group_members(uuid, uuid[]) from public, anon;
grant execute on function public.add_group_members(uuid, uuid[]) to authenticated;

create function public.remove_group_member(p_conv uuid, p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid());
begin
 if p_user = v_me or not exists (select 1 from public.conversations c join public.conversation_members m on m.conversation_id = c.id
     where c.id = p_conv and c.kind = 'group' and m.user_id = v_me and m.role = 'owner') then
  raise exception 'not allowed' using errcode = '42501';
 end if;
 delete from public.conversation_members where conversation_id = p_conv and user_id = p_user;
end;$$;
revoke execute on function public.remove_group_member(uuid, uuid) from public, anon;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;

-- Anyone can leave. The last person out closes the group; if the owner leaves, the longest-standing member takes over.
create function public.leave_group(p_conv uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_role text; v_next uuid;
begin
 select m.role into v_role from public.conversation_members m join public.conversations c on c.id = m.conversation_id
  where m.conversation_id = p_conv and m.user_id = v_me and c.kind = 'group';
 if v_role is null then raise exception 'not allowed' using errcode = '42501'; end if;
 delete from public.conversation_members where conversation_id = p_conv and user_id = v_me;
 select user_id into v_next from public.conversation_members where conversation_id = p_conv order by joined_at, user_id limit 1;
 if v_next is null then
  delete from public.conversations where id = p_conv;
 elsif v_role = 'owner' then
  update public.conversation_members set role = 'owner' where conversation_id = p_conv and user_id = v_next;
 end if;
end;$$;
revoke execute on function public.leave_group(uuid) from public, anon;
grant execute on function public.leave_group(uuid) to authenticated;

-- Direct-only lookups, so a group the two people share is never mistaken for their private conversation.
create or replace function public.start_conversation(p_user uuid, p_body text, p_post uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_conv uuid;
begin
 if v_me is null then raise exception 'sign in first' using errcode='42501'; end if;
 if p_user = v_me then raise exception 'cannot message yourself' using errcode='check_violation'; end if;
 if p_body is null or length(trim(p_body)) = 0 or length(p_body) > 3000 then
  raise exception 'message is empty or too long' using errcode='check_violation';
 end if;
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

create or replace function public.answer_hello(p_request uuid, p_accept boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); r record; v_conv uuid; v_name text;
begin
 select * into r from public.message_requests where id = p_request and to_user = v_me and status = 'pending' for update;
 if r.id is null then raise exception 'request not found' using errcode = 'no_data_found'; end if;
 if not p_accept then
  update public.message_requests set status = 'declined', answered_at = now() where id = r.id;
  return null;
 end if;
 select c.id into v_conv from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = r.from_user
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = r.to_user
  where c.kind = 'direct'
  limit 1;
 if v_conv is null then
  insert into public.conversations default values returning id into v_conv;
  insert into public.conversation_members(conversation_id, user_id) values (v_conv, r.from_user), (v_conv, r.to_user);
 end if;
 perform set_config('piron.skip_notify', '1', true);
 insert into public.messages(conversation_id, sender_id, body) values (v_conv, r.from_user, r.body);
 perform set_config('piron.skip_notify', '0', true);
 update public.message_requests set status = 'accepted', conversation_id = v_conv, answered_at = now() where id = r.id;
 select display_name into v_name from public.profiles where id = v_me;
 perform public.notify(r.from_user, 'Request accepted', v_name, '/app/messages/' || v_conv);
 return v_conv;
end;$$;

-- Group messages carry the group name in the notification body.
create or replace function public.notify_message() returns trigger language plpgsql security definer set search_path='' as $$
declare v_sender text; v_title text;
begin
 if coalesce(current_setting('piron.skip_notify', true), '') = '1' then return new; end if;
 select display_name into v_sender from public.profiles where id = new.sender_id;
 select case when kind = 'group' then title else null end into v_title from public.conversations where id = new.conversation_id;
 insert into public.notifications(user_id, title, body, link_path)
 select m.user_id, 'New message',
        coalesce(left(v_title, 30) || ' · ', '') || coalesce(v_sender || ': ', '') || left(new.body, 80),
        '/app/messages/' || new.conversation_id
 from public.conversation_members m where m.conversation_id = new.conversation_id and m.user_id <> new.sender_id;
 return new;
end;$$;

create or replace function public.notification_title_km(p_title text) returns text language sql immutable set search_path='' as $$
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
  else p_title end
$$;

commit;
