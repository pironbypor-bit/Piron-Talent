-- Piron Work | migration 0024 | invite several providers to a project (people plan, 2026-10-14)
-- Run after 0023_group_messages.sql in the Supabase SQL editor.
-- Generalises the single rehire invitation (posts.invited_provider_id stays for the 24-hour window).
-- Who can be invited: providers who are open to work (is_available) or people the author already talks with.
begin;

create table public.post_invitations (
 post_id uuid not null references public.posts(id) on delete cascade,
 provider_id uuid not null references public.profiles(id) on delete cascade,
 invited_by uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (post_id, provider_id),
 check (provider_id <> invited_by)
);
create index post_invitations_provider_idx on public.post_invitations(provider_id);
alter table public.post_invitations enable row level security;
-- No reference to posts here, so the policy on posts below cannot loop back into this one.
create policy post_invitations_read on public.post_invitations for select to authenticated
 using (provider_id = (select auth.uid()) or invited_by = (select auth.uid()));

create function public.is_invited(p_post uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.post_invitations i where i.post_id = p_post and i.provider_id = (select auth.uid()))
$$;
grant execute on function public.is_invited(uuid) to authenticated;

-- A post still inside its private window is also visible to everyone invited through the table.
drop policy posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated using (
 author_id = (select auth.uid())
 or (status = 'published' and (opens_at is null or opens_at <= now()
      or invited_provider_id = (select auth.uid()) or public.is_invited(id)))
);

create function public.invite_providers(p_post uuid, p_providers uuid[]) returns integer
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
  if exists (select 1 from public.post_invitations where post_id = p_post and provider_id = u) then continue; end if;
  if not (exists (select 1 from public.profiles where id = u and is_available) or public.can_group_with(v_me, u, null)) then continue; end if;
  insert into public.post_invitations(post_id, provider_id, invited_by) values (p_post, u, v_me);
  perform public.notify(u, 'Project invitation', p.title, '/app/post/' || p_post);
  n := n + 1;
 end loop;
 return n;
end;$$;
revoke execute on function public.invite_providers(uuid, uuid[]) from public, anon;
grant execute on function public.invite_providers(uuid, uuid[]) to authenticated;

commit;
