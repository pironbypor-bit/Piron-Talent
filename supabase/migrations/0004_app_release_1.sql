-- Piron Talent | migration 0004 | app release 1: Workspace, Services, Jobs, Messages, Profile on real data
-- Run after 0003 in the Supabase SQL editor. Rules unchanged: RLS default deny, status changes only in server code
-- or security-definer functions, no secrets in the client. Shift jobs stay closed until the legal review.
begin;

-- 1. Profile fields the app shows on provider cards and the profile tab.
alter table public.profiles
 add column role_line text check (role_line is null or length(role_line) <= 80),
 add column primary_category_id bigint references public.categories(id),
 add column price_from text check (price_from is null or length(price_from) <= 40),
 add column remote boolean not null default false,
 add column identity_checked boolean not null default false,
 add column completed_jobs integer not null default 0 check (completed_jobs >= 0);

alter table public.posts
 add column place text check (place is null or length(place) <= 80),
 add column price_text text check (price_text is null or length(price_text) <= 40),
 add constraint posts_title_len check (length(title) between 3 and 120),
 add constraint posts_body_len check (length(body) between 10 and 3000);

alter table public.jobs
 add column job_type text not null default 'freelance' check (job_type in ('part_time','short_term','freelance','project'));

alter table public.skills add constraint skills_name_len check (length(name) between 1 and 60);

-- 2. Public reading: the app is browsable without an account. Private data stays in profile_private.
create policy profiles_read_public on public.profiles for select to anon using (true);
create policy posts_read_public on public.posts for select to anon using (status='published');
create policy comments_read_public on public.post_comments for select to anon
 using (exists(select 1 from public.posts p where p.id=post_id and p.status='published'));
create policy reactions_read_public on public.post_reactions for select to anon using (true);
create policy profile_skills_read_public on public.profile_skills for select to anon using (true);
create policy skills_read_public on public.skills for select to anon using (true);
create policy portfolio_read_public on public.portfolio_items for select to anon using (true);
create policy reviews_read_public on public.reviews for select to anon using (true);
create policy jobs_read_public on public.jobs for select to anon using (status='published');

-- 3. Keep on a provider.
create table public.saved_providers (
 user_id uuid not null references public.profiles(id) on delete cascade,
 provider_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (user_id, provider_id)
);
alter table public.saved_providers enable row level security;
create policy saved_providers_own on public.saved_providers for all to authenticated
 using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

-- 4. Avatars: public bucket, each person writes only inside their own folder.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('avatars','avatars',true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy avatars_read on storage.objects for select to anon, authenticated using (bucket_id='avatars');
create policy avatars_add on storage.objects for insert to authenticated
 with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_edit on storage.objects for update to authenticated
 using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy avatars_delete on storage.objects for delete to authenticated
 using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- 5. Identity checks: a private bucket, one row per upload, reviewed by an admin.
create type public.identity_status as enum ('pending','checked','rejected');
create table public.identity_checks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 image_path text not null,
 status public.identity_status not null default 'pending',
 note text,
 reviewed_by uuid references public.profiles(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create index identity_checks_pending_idx on public.identity_checks(created_at) where status='pending';
alter table public.identity_checks enable row level security;
create policy identity_read on public.identity_checks for select to authenticated
 using (user_id=(select auth.uid()) or public.is_admin());
create policy identity_add on public.identity_checks for insert to authenticated
 with check (user_id=(select auth.uid()) and status='pending' and note is null and reviewed_by is null and reviewed_at is null);
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('identity','identity',false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy identity_images_add on storage.objects for insert to authenticated
 with check (bucket_id='identity' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy identity_images_read on storage.objects for select to authenticated
 using (bucket_id='identity' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.is_admin()));

create function public.admin_review_identity(p_id uuid, p_status public.identity_status, p_note text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid;
begin
 perform public.assert_admin();
 update public.identity_checks set status=p_status, note=p_note, reviewed_by=(select auth.uid()), reviewed_at=now()
  where id=p_id returning user_id into v_user;
 if v_user is null then raise exception 'check not found' using errcode='no_data_found'; end if;
 update public.profiles set identity_checked=(p_status='checked') where id=v_user;
 insert into public.notifications(user_id, title, body, link_path)
 values (v_user, case when p_status='checked' then 'Identity checked' else 'Identity check rejected' end, p_note, '/app/profile');
end;$$;

-- 6. Conversations start only with consent: the other person posted on the Workspace (posting invites contact),
--    is an available provider, or already talks with you. Connect, Request a quote and Message all use this.
create function public.start_conversation(p_user uuid, p_body text, p_post uuid default null)
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

-- 7. Notifications are written by triggers, never by the client. Titles are English keys the UI translates.
create function public.notify_message() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notifications(user_id, title, body, link_path)
 select m.user_id, 'New message', left(new.body, 120), '/app/messages/' || new.conversation_id
 from public.conversation_members m where m.conversation_id=new.conversation_id and m.user_id<>new.sender_id;
 return new;
end;$$;
create trigger messages_notify after insert on public.messages for each row execute function public.notify_message();

create function public.notify_comment() returns trigger language plpgsql security definer set search_path='' as $$
declare v_author uuid;
begin
 select author_id into v_author from public.posts where id=new.post_id;
 if v_author is not null and v_author<>new.author_id then
  insert into public.notifications(user_id, title, body, link_path)
  values (v_author, 'New comment', left(new.body, 120), '/app/post/' || new.post_id);
 end if;
 return new;
end;$$;
create trigger comments_notify after insert on public.post_comments for each row execute function public.notify_comment();

create function public.notify_application() returns trigger language plpgsql security definer set search_path='' as $$
declare v_poster uuid; v_title text;
begin
 select poster_id, title into v_poster, v_title from public.jobs where id=new.job_id;
 insert into public.notifications(user_id, title, body, link_path)
 values (v_poster, 'New application', v_title, '/app/jobs/' || new.job_id);
 return new;
end;$$;
create trigger applications_notify after insert on public.job_applications for each row execute function public.notify_application();

-- 8. Posting rules: no hire_shift posts until the legal review; jobs publish through a function.
create function public.posts_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.kind = 'hire_shift' then raise exception 'shift posts open after the legal review' using errcode='42501'; end if;
 return new;
end;$$;
create trigger posts_guard before insert on public.posts for each row execute function public.posts_guard();

create function public.publish_job(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_type text;
begin
 select job_type into v_type from public.jobs where id=p_id and poster_id=(select auth.uid());
 if v_type is null then raise exception 'job not found' using errcode='no_data_found'; end if;
 if v_type in ('part_time','short_term') then raise exception 'shift jobs open after the legal review' using errcode='42501'; end if;
 update public.jobs set status='published' where id=p_id;
end;$$;

-- 9. Skills from a short list of names; new names join the taxonomy.
create function public.set_my_skills(p_names text[]) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_name text; v_id bigint; v_count int := 0;
begin
 if v_me is null then raise exception 'sign in first' using errcode='42501'; end if;
 delete from public.profile_skills where profile_id=v_me;
 foreach v_name in array coalesce(p_names, array[]::text[]) loop
  v_name := trim(v_name);
  if v_name = '' or length(v_name) > 60 then continue; end if;
  v_count := v_count + 1; if v_count > 10 then exit; end if;
  insert into public.skills(name) values (v_name) on conflict (name) do nothing;
  select id into v_id from public.skills where name=v_name;
  insert into public.profile_skills(profile_id, skill_id) values (v_me, v_id) on conflict do nothing;
 end loop;
end;$$;

revoke execute on function public.admin_review_identity(uuid, public.identity_status, text) from public, anon;
revoke execute on function public.start_conversation(uuid, text, uuid) from public, anon;
revoke execute on function public.publish_job(uuid) from public, anon;
revoke execute on function public.set_my_skills(text[]) from public, anon;
grant execute on function public.admin_review_identity(uuid, public.identity_status, text) to authenticated;
grant execute on function public.start_conversation(uuid, text, uuid) to authenticated;
grant execute on function public.publish_job(uuid) to authenticated;
grant execute on function public.set_my_skills(text[]) to authenticated;

commit;
