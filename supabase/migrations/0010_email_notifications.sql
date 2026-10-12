-- Piron Talent | migration 0010 | email for every in-app notification, sent by Postgres through the Brevo API
-- Run after 0009_city_district.sql in the Supabase SQL editor. Then, once, as the owner:
--   select vault.create_secret('<brevo v3 api key>', 'brevo_api_key');
--   select vault.create_secret('https://piron-talent.poleangpor1.workers.dev', 'site_url');   -- optional, used in links
-- Without the key the trigger does nothing, so the app keeps working.
begin;

create extension if not exists pg_net with schema extensions;

alter table public.profile_private add column email_notifications boolean not null default true;
alter table public.notifications add column emailed_at timestamptz;

-- The switch in Settings. A profile_private row is created on first use.
create function public.set_email_notifications(p_on boolean) returns void language sql security definer set search_path='' as $$
 insert into public.profile_private(user_id, email_notifications) values ((select auth.uid()), p_on)
 on conflict (user_id) do update set email_notifications = excluded.email_notifications
$$;
revoke execute on function public.set_email_notifications(boolean) from public, anon;
grant execute on function public.set_email_notifications(boolean) to authenticated;

create function public.email_notifications_enabled(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select email_notifications from public.profile_private where user_id=p_user), true)
$$;
revoke execute on function public.email_notifications_enabled(uuid) from public, anon;

-- Khmer for the titles the triggers write. English stays as the fallback.
create function public.notification_title_km(p_title text) returns text language sql immutable set search_path='' as $$
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
  else p_title end
$$;

-- One email per notification, at most one per person per 15 minutes; the in-app list stays complete.
create function public.email_notification() returns trigger language plpgsql security definer set search_path='' as $$
declare v_email text; v_key text; v_site text; v_html text; v_link text; v_km text;
begin
 if not public.email_notifications_enabled(new.user_id) then return new; end if;
 if exists (select 1 from public.notifications where user_id=new.user_id and emailed_at > now() - interval '15 minutes') then return new; end if;
 select decrypted_secret into v_key from vault.decrypted_secrets where name='brevo_api_key' limit 1;
 if v_key is null then return new; end if;
 select decrypted_secret into v_site from vault.decrypted_secrets where name='site_url' limit 1;
 v_site := coalesce(v_site, 'https://piron-talent.poleangpor1.workers.dev');
 select email into v_email from auth.users where id=new.user_id;
 if v_email is null then return new; end if;
 v_link := v_site || coalesce(new.link_path, '/app/profile');
 v_km := public.notification_title_km(new.title);
 v_html := '<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1c1917">'
  || '<p style="font-size:14px;color:#78716c;margin:0 0 16px">Piron Talent</p>'
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
   'sender', jsonb_build_object('name', 'Piron Talent', 'email', 'leangporpo9@gmail.com'),
   'to', jsonb_build_array(jsonb_build_object('email', v_email)),
   'subject', 'Piron Talent · ' || v_km || ' · ' || new.title,
   'htmlContent', v_html)
 );
 new.emailed_at := now();
 return new;
exception when others then
 -- Email is best effort: never block the notification itself.
 return new;
end;$$;
create trigger notifications_email before insert on public.notifications for each row execute function public.email_notification();

commit;
