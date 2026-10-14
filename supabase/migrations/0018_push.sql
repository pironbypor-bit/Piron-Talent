-- Piron Talent | migration 0018 | phone notifications from the installed app (Web Push)
-- Run after 0017_notification_centre.sql. Then once, as the owner, the shared secret the Worker also holds:
--   select vault.create_secret('<random secret>', 'push_hook_secret');
-- Without it the trigger does nothing and the app keeps working.
begin;

create table public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 endpoint text not null unique check (length(endpoint) <= 1000),
 p256dh text not null check (length(p256dh) <= 200),
 auth text not null check (length(auth) <= 100),
 user_agent text check (user_agent is null or length(user_agent) <= 300),
 created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
create policy push_own_read on public.push_subscriptions for select to authenticated using (user_id = (select auth.uid()));
create policy push_own_add on public.push_subscriptions for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_own_delete on public.push_subscriptions for delete to authenticated using (user_id = (select auth.uid()));

-- The Worker removes a subscription the push service reported dead; it proves itself with the shared secret.
create function public.prune_push_subscription(p_endpoint text, p_secret text) returns void language plpgsql security definer set search_path='' as $$
declare v_secret text;
begin
 select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_hook_secret' limit 1;
 if v_secret is null or p_secret is null or p_secret <> v_secret then raise exception 'not allowed' using errcode = '42501'; end if;
 delete from public.push_subscriptions where endpoint = p_endpoint;
end;$$;
revoke execute on function public.prune_push_subscription(text, text) from public;
grant execute on function public.prune_push_subscription(text, text) to anon, authenticated;

-- After every notification: hand the row and the person's devices to the Worker, which encrypts and sends.
create function public.push_notification() returns trigger language plpgsql security definer set search_path='' as $$
declare v_secret text; v_site text; v_subs jsonb;
begin
 select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_hook_secret' limit 1;
 if v_secret is null then return new; end if;
 select jsonb_agg(jsonb_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth)) into v_subs
 from public.push_subscriptions where user_id = new.user_id;
 if v_subs is null then return new; end if;
 select decrypted_secret into v_site from vault.decrypted_secrets where name = 'site_url' limit 1;
 perform net.http_post(
  url := coalesce(v_site, 'https://app.piron.tech') || '/api/push',
  headers := jsonb_build_object('content-type', 'application/json', 'x-push-secret', v_secret),
  body := jsonb_build_object('title', public.notification_title_km(new.title), 'body', new.body, 'url', coalesce(new.link_path, '/app/notifications'), 'subs', v_subs),
  timeout_milliseconds := 8000
 );
 return new;
exception when others then
 return new;
end;$$;
create trigger notifications_push after insert on public.notifications for each row execute function public.push_notification();

commit;
