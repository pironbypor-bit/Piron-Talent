-- Piron Talent | migration 0017 | notification centre: live badges, conversation read marks, richer bodies,
-- email narrowed to a quiet backup (owner decision 2026-10-14: everything happens inside the app).
-- Run after 0016_identity_level2.sql in the Supabase SQL editor.
begin;

-- 1. Realtime: the browser subscribes to its own notifications and to messages in its conversations.
--    Row level security applies to the stream, so a person only ever receives rows they could select.
do $$ begin
 if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
  create publication supabase_realtime;
 end if;
end $$;
alter publication supabase_realtime add table public.notifications, public.messages;

-- 2. Which conversations have something new: a read mark per member, set when the conversation is opened.
alter table public.conversation_members add column last_read_at timestamptz;

create function public.mark_conversation_read(p_conv uuid) returns void language sql security definer set search_path='' as $$
 update public.conversation_members set last_read_at = now() where conversation_id = p_conv and user_id = (select auth.uid())
$$;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

create function public.unread_conversations() returns integer language sql stable security definer set search_path='' as $$
 select count(*)::int from public.conversation_members cm
 where cm.user_id = (select auth.uid())
   and exists (select 1 from public.messages m where m.conversation_id = cm.conversation_id and m.sender_id <> cm.user_id
               and m.created_at > coalesce(cm.last_read_at, cm.joined_at))
$$;
revoke execute on function public.unread_conversations() from public, anon;
grant execute on function public.unread_conversations() to authenticated;

-- 3. Bodies that read on their own in the list: who sent the message, who quoted and for how much.
create or replace function public.notify_message() returns trigger language plpgsql security definer set search_path='' as $$
declare v_sender text;
begin
 select display_name into v_sender from public.profiles where id = new.sender_id;
 insert into public.notifications(user_id, title, body, link_path)
 select m.user_id, 'New message', coalesce(v_sender || ': ', '') || left(new.body, 100), '/app/messages/' || new.conversation_id
 from public.conversation_members m where m.conversation_id = new.conversation_id and m.user_id <> new.sender_id;
 return new;
end;$$;

create or replace function public.notify_quote() returns trigger language plpgsql security definer set search_path='' as $$
declare v_author uuid; v_title text; v_provider text;
begin
 if new.post_id is null then return new; end if;
 select author_id, title into v_author, v_title from public.posts where id = new.post_id;
 select display_name into v_provider from public.profiles where id = new.provider_id;
 perform public.notify(v_author, 'New quote', coalesce(v_provider || ' · ', '') || '$' || new.price || ' · ' || v_title, '/app/post/' || new.post_id);
 return new;
end;$$;

-- 4. Email is a quiet backup now: only the two events that cost money when missed. Everything else is in-app only.
create or replace function public.email_notification() returns trigger language plpgsql security definer set search_path='' as $$
declare v_email text; v_key text; v_site text; v_html text; v_link text; v_km text;
begin
 if new.title not in ('Quote accepted', 'Work delivered') then return new; end if;
 if not public.email_notifications_enabled(new.user_id) then return new; end if;
 if exists (select 1 from public.notifications where user_id=new.user_id and emailed_at > now() - interval '15 minutes') then return new; end if;
 select decrypted_secret into v_key from vault.decrypted_secrets where name='brevo_api_key' limit 1;
 if v_key is null then return new; end if;
 select decrypted_secret into v_site from vault.decrypted_secrets where name='site_url' limit 1;
 v_site := coalesce(v_site, 'https://app.piron.tech');
 select email into v_email from auth.users where id=new.user_id;
 if v_email is null then return new; end if;
 v_link := v_site || coalesce(new.link_path, '/app/notifications');
 v_km := public.notification_title_km(new.title);
 v_html := '<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1c1917">'
  || '<p style="font-size:14px;color:#78716c;margin:0 0 16px">Piron Work</p>'
  || '<h1 style="font-size:20px;margin:0 0 4px">' || v_km || '</h1>'
  || '<p style="font-size:14px;color:#78716c;margin:0 0 16px">' || new.title || '</p>'
  || coalesce('<p style="font-size:16px;line-height:1.5;margin:0 0 20px">' || replace(replace(new.body, '<', '&lt;'), '>', '&gt;') || '</p>', '')
  || '<a href="' || v_link || '" style="display:inline-block;background:#f5b800;color:#1c1917;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:999px">បើកមើល · Open</a>'
  || '<p style="font-size:12px;color:#a8a29e;margin:28px 0 0">ដើម្បីបញ្ឈប់អ៊ីមែលទាំងនេះ សូមចូលទៅការកំណត់។ To stop these emails, open Settings: <a href="' || v_site || '/app/settings" style="color:#78716c">' || v_site || '/app/settings</a></p>'
  || '</div>';
 perform net.http_post(
  url := 'https://api.brevo.com/v3/smtp/email',
  headers := jsonb_build_object('api-key', v_key, 'content-type', 'application/json', 'accept', 'application/json'),
  body := jsonb_build_object(
   'sender', jsonb_build_object('name', 'Piron Work', 'email', 'leangporpo9@gmail.com'),
   'to', jsonb_build_array(jsonb_build_object('email', v_email)),
   'subject', 'Piron Work · ' || v_km || ' · ' || new.title,
   'htmlContent', v_html)
 );
 new.emailed_at := now();
 return new;
exception when others then
 return new;
end;$$;

commit;
