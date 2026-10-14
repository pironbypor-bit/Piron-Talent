-- Piron Work | migration 0022 | "Say hello": message requests (people plan, 2026-10-14)
-- Run after 0021_work_record_endorsements.sql in the Supabase SQL editor.
-- The consent rule stays: a conversation starts only when the other person is open (post author or available
-- provider), or they accept a request. A decline is silent; the sender cannot ask again for 30 days.
begin;

create table public.message_requests (
 id uuid primary key default gen_random_uuid(),
 from_user uuid not null references public.profiles(id) on delete cascade,
 to_user uuid not null references public.profiles(id) on delete cascade,
 body text not null check (length(body) between 1 and 300),
 status text not null default 'pending' check (status in ('pending','accepted','declined')),
 conversation_id uuid references public.conversations(id) on delete set null,
 created_at timestamptz not null default now(),
 answered_at timestamptz,
 check (from_user <> to_user)
);
create unique index message_requests_pending_idx on public.message_requests(from_user, to_user) where status = 'pending';
create index message_requests_to_idx on public.message_requests(to_user, status);
alter table public.message_requests enable row level security;
create policy message_requests_own on public.message_requests for select to authenticated
 using (from_user = (select auth.uid()) or to_user = (select auth.uid()));

-- What the profile page should offer me for this person.
create function public.contact_state(p_user uuid) returns table(state text, conv_id uuid)
language plpgsql stable security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_conv uuid;
begin
 if v_me is null then return query select 'anon'::text, null::uuid; return; end if;
 if p_user = v_me then return query select 'self'::text, null::uuid; return; end if;
 select c.id into v_conv from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = v_me
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_user
  limit 1;
 if v_conv is not null then return query select 'conversation'::text, v_conv; return; end if;
 if exists (select 1 from public.profiles pr where pr.id = p_user and pr.is_available) then return query select 'open'::text, null::uuid; return; end if;
 if exists (select 1 from public.message_requests r where r.from_user = v_me and r.to_user = p_user and r.status = 'pending') then return query select 'pending'::text, null::uuid; return; end if;
 if exists (select 1 from public.message_requests r where r.from_user = p_user and r.to_user = v_me and r.status = 'pending') then return query select 'incoming'::text, null::uuid; return; end if;
 if exists (select 1 from public.message_requests r where r.from_user = v_me and r.to_user = p_user and r.status = 'declined' and r.answered_at > now() - interval '30 days') then return query select 'declined'::text, null::uuid; return; end if;
 return query select 'can_request'::text, null::uuid;
end;$$;
grant execute on function public.contact_state(uuid) to anon, authenticated;

create function public.send_hello(p_user uuid, p_body text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_state text; v_id uuid; v_name text;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 select cs.state into v_state from public.contact_state(p_user) cs;
 if v_state is distinct from 'can_request' then raise exception 'not allowed: %', v_state using errcode = '42501'; end if;
 if p_body is null or length(trim(p_body)) = 0 or length(p_body) > 300 then raise exception 'message is empty or too long' using errcode = 'check_violation'; end if;
 if (select count(*) from public.message_requests where from_user = v_me and created_at > now() - interval '1 day') >= 5 then
  raise exception 'too many requests today' using errcode = 'check_violation';
 end if;
 insert into public.message_requests(from_user, to_user, body) values (v_me, p_user, trim(p_body)) returning id into v_id;
 select display_name into v_name from public.profiles where id = v_me;
 perform public.notify(p_user, 'Message request', coalesce(v_name || ': ', '') || left(trim(p_body), 100), '/app/messages');
 return v_id;
end;$$;
revoke execute on function public.send_hello(uuid, text) from public, anon;
grant execute on function public.send_hello(uuid, text) to authenticated;

-- Accept opens a conversation with the hello as its first message; decline is silent.
create function public.answer_hello(p_request uuid, p_accept boolean) returns uuid
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
  limit 1;
 if v_conv is null then
  insert into public.conversations default values returning id into v_conv;
  insert into public.conversation_members(conversation_id, user_id) values (v_conv, r.from_user), (v_conv, r.to_user);
 end if;
 -- The hello is the first message, but the person who just accepted it should not be notified of it again.
 perform set_config('piron.skip_notify', '1', true);
 insert into public.messages(conversation_id, sender_id, body) values (v_conv, r.from_user, r.body);
 perform set_config('piron.skip_notify', '0', true);
 update public.message_requests set status = 'accepted', conversation_id = v_conv, answered_at = now() where id = r.id;
 select display_name into v_name from public.profiles where id = v_me;
 perform public.notify(r.from_user, 'Request accepted', v_name, '/app/messages/' || v_conv);
 return v_conv;
end;$$;
revoke execute on function public.answer_hello(uuid, boolean) from public, anon;
grant execute on function public.answer_hello(uuid, boolean) to authenticated;

create or replace function public.notify_message() returns trigger language plpgsql security definer set search_path='' as $$
declare v_sender text;
begin
 if coalesce(current_setting('piron.skip_notify', true), '') = '1' then return new; end if;
 select display_name into v_sender from public.profiles where id = new.sender_id;
 insert into public.notifications(user_id, title, body, link_path)
 select m.user_id, 'New message', coalesce(v_sender || ': ', '') || left(new.body, 100), '/app/messages/' || new.conversation_id
 from public.conversation_members m where m.conversation_id = new.conversation_id and m.user_id <> new.sender_id;
 return new;
end;$$;

-- The Messages badge counts conversations with something new plus requests waiting for me.
create or replace function public.unread_conversations() returns integer language sql stable security definer set search_path='' as $$
 select (select count(*)::int from public.conversation_members cm
         where cm.user_id = (select auth.uid())
           and exists (select 1 from public.messages m where m.conversation_id = cm.conversation_id and m.sender_id <> cm.user_id
                       and m.created_at > coalesce(cm.last_read_at, cm.joined_at)))
      + (select count(*)::int from public.message_requests r where r.to_user = (select auth.uid()) and r.status = 'pending')
$$;

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
  else p_title end
$$;

commit;
