-- Piron Talent is now Piron Work (owner decision 2026-10-14). Only the email sender name and subject change here;
-- table, function and Worker names stay as they are.
begin;
create or replace function public.email_notification() returns trigger language plpgsql security definer set search_path='' as $$
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
 -- Email is best effort: never block the notification itself.
 return new;
end;$$;
commit;
