-- Piron Work | migration 0050 | Piron Work Space step 5: feature switches (off, only me, chosen people, everyone)
-- Run after 0049_space_errors.sql. The tables are closed; everything goes through the functions below.
begin;

create table public.feature_flags (
 key text primary key check (key ~ '^[a-z0-9_]{2,40}$'),
 title text not null,
 description text not null default '',
 mode text not null default 'off' check (mode in ('off', 'owner', 'people', 'everyone')),
 updated_at timestamptz not null default now()
);
create table public.feature_flag_people (
 key text not null references public.feature_flags(key) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 added_at timestamptz not null default now(),
 primary key (key, user_id)
);
alter table public.feature_flags enable row level security;
alter table public.feature_flag_people enable row level security;
revoke all on public.feature_flags, public.feature_flag_people from anon, authenticated;

insert into public.feature_flags(key, title, description, mode) values
 ('payments', 'Payments tab, invoices and payout account', 'The Payments tab, the invoice pages and the payout account page. Records only; no money moves through Piron Work.', 'everyone');

-- The keys that are on for the caller. Anonymous callers get only the ones that are on for everyone.
create function public.my_features() returns text[] language sql stable security definer set search_path = '' as $$
 select coalesce(array_agg(f.key order by f.key), '{}') from public.feature_flags f
 where f.mode = 'everyone'
  or (f.mode in ('owner', 'people') and public.is_owner())
  or (f.mode = 'people' and exists (select 1 from public.feature_flag_people p where p.key = f.key and p.user_id = (select auth.uid())));
$$;
revoke execute on function public.my_features() from public;
grant execute on function public.my_features() to anon, authenticated;

create function public.space_features() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_owner() then return null; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('key', f.key, 'title', f.title, 'description', f.description, 'mode', f.mode, 'updated_at', f.updated_at,
   'people', coalesce((select jsonb_agg(jsonb_build_object('id', p.user_id, 'name', pr.display_name) order by pr.display_name)
     from public.feature_flag_people p join public.profiles pr on pr.id = p.user_id where p.key = f.key), '[]'::jsonb)) order by f.title)
  from public.feature_flags f), '[]'::jsonb);
end;$$;

create function public.space_set_feature(p_key text, p_mode text) returns void language plpgsql security definer set search_path = '' as $$
declare old text;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
 if p_mode not in ('off', 'owner', 'people', 'everyone') then raise exception 'bad mode'; end if;
 select mode into old from public.feature_flags where key = p_key;
 if old is null then raise exception 'unknown feature'; end if;
 update public.feature_flags set mode = p_mode, updated_at = now() where key = p_key;
 insert into public.audit_log(actor_id, action, target) values ((select auth.uid()), 'Feature switch', p_key || ': ' || old || ' to ' || p_mode);
end;$$;

create function public.space_feature_person(p_key text, p_user uuid, p_add boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_owner() then raise exception 'owner only' using errcode = '42501'; end if;
 if not exists (select 1 from public.feature_flags where key = p_key) then raise exception 'unknown feature'; end if;
 if p_add then
  insert into public.feature_flag_people(key, user_id) values (p_key, p_user) on conflict do nothing;
 else
  delete from public.feature_flag_people where key = p_key and user_id = p_user;
 end if;
 insert into public.audit_log(actor_id, action, target)
  values ((select auth.uid()), case when p_add then 'Feature person added' else 'Feature person removed' end,
   p_key || ': ' || coalesce((select display_name from public.profiles where id = p_user), p_user::text));
end;$$;

create function public.space_feature_log() returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_owner() then return null; end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x.at desc) from (
  select a.created_at as at, a.action, a.target from public.audit_log a where a.action like 'Feature%' order by a.created_at desc limit 20) x), '[]'::jsonb);
end;$$;

revoke execute on function public.space_features() from public, anon;
revoke execute on function public.space_set_feature(text, text) from public, anon;
revoke execute on function public.space_feature_person(text, uuid, boolean) from public, anon;
revoke execute on function public.space_feature_log() from public, anon;
grant execute on function public.space_features() to authenticated;
grant execute on function public.space_set_feature(text, text) to authenticated;
grant execute on function public.space_feature_person(text, uuid, boolean) to authenticated;
grant execute on function public.space_feature_log() to authenticated;

commit;
