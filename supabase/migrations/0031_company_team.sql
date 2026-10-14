-- Piron Work | migration 0031 | company managers, invitations and a team chat (2026-10-14)
-- Run after 0030_notification_preferences.sql in the Supabase SQL editor.
-- Roles: owner, manager, member. Owner and managers post jobs and projects under the company and see applicants;
-- members belong to the team and its chat. Invitations go only to people the inviter already talks with, and the
-- person must accept. Accepting adds them to the company's team chat (a group conversation).
begin;

alter table public.businesses add column conversation_id uuid references public.conversations(id) on delete set null;

create function public.is_business_manager(b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.business_members m where m.business_id = b and m.user_id = (select auth.uid()) and m.role in ('owner','manager'))
$$;
grant execute on function public.is_business_manager(uuid) to authenticated;

-- Posting under a company now needs owner or manager (it was any member).
drop policy posts_create on public.posts;
create policy posts_create on public.posts for insert to authenticated
 with check (author_id = (select auth.uid()) and (business_id is null or public.is_business_manager(business_id)));
drop policy posts_edit on public.posts;
create policy posts_edit on public.posts for update to authenticated
 using (author_id = (select auth.uid()))
 with check (author_id = (select auth.uid()) and (business_id is null or public.is_business_manager(business_id)));
drop policy jobs_create on public.jobs;
create policy jobs_create on public.jobs for insert to authenticated
 with check (poster_id = (select auth.uid()) and status = 'draft' and (business_id is null or public.is_business_manager(business_id)));
drop policy applications_read on public.job_applications;
create policy applications_read on public.job_applications for select to authenticated using (
 applicant_id = (select auth.uid())
 or exists (select 1 from public.jobs j where j.id = job_applications.job_id and (j.poster_id = (select auth.uid()) or (j.business_id is not null and public.is_business_manager(j.business_id))))
);

create table public.business_invitations (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role text not null check (role in ('manager','member')),
 invited_by uuid not null references public.profiles(id) on delete cascade,
 status text not null default 'pending' check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 answered_at timestamptz
);
create unique index business_invitations_pending_idx on public.business_invitations(business_id, user_id) where status = 'pending';
alter table public.business_invitations enable row level security;
create policy business_invitations_read on public.business_invitations for select to authenticated
 using (user_id = (select auth.uid()) or invited_by = (select auth.uid()));

-- The team chat: created the first time it is needed, owner as its owner.
create function public.ensure_business_chat(p_business uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare b record; v_conv uuid;
begin
 select * into b from public.businesses where id = p_business;
 if b.id is null then raise exception 'not found' using errcode = 'no_data_found'; end if;
 if b.conversation_id is not null then return b.conversation_id; end if;
 insert into public.conversations(kind, title, created_by) values ('group', left(b.name, 80), b.owner_id) returning id into v_conv;
 insert into public.conversation_members(conversation_id, user_id, role)
  select v_conv, m.user_id, case when m.user_id = b.owner_id then 'owner' else 'member' end from public.business_members m where m.business_id = p_business;
 update public.businesses set conversation_id = v_conv where id = p_business;
 return v_conv;
end;$$;
revoke execute on function public.ensure_business_chat(uuid) from public, anon, authenticated;

-- Open the chat from the company page: any member may ask for it.
create function public.open_business_chat(p_business uuid) returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not exists (select 1 from public.business_members where business_id = p_business and user_id = (select auth.uid())) then
  raise exception 'not allowed' using errcode = '42501';
 end if;
 return public.ensure_business_chat(p_business);
end;$$;
revoke execute on function public.open_business_chat(uuid) from public, anon;
grant execute on function public.open_business_chat(uuid) to authenticated;

create function public.invite_to_business(p_business uuid, p_user uuid, p_role text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_role text; b record; v_id uuid;
begin
 select role into v_role from public.business_members where business_id = p_business and user_id = v_me;
 select * into b from public.businesses where id = p_business;
 if v_role is null or v_role = 'member' or b.id is null then raise exception 'not allowed' using errcode = '42501'; end if;
 if p_role not in ('manager','member') or (p_role = 'manager' and v_role <> 'owner') then raise exception 'not allowed' using errcode = '42501'; end if;
 if p_user = v_me or exists (select 1 from public.business_members where business_id = p_business and user_id = p_user) then raise exception 'already in the team' using errcode = 'check_violation'; end if;
 if (select count(*) from public.business_members where business_id = p_business) >= 20 then raise exception 'team is full' using errcode = 'check_violation'; end if;
 if not public.can_group_with(v_me, p_user, null) then raise exception 'not allowed' using errcode = '42501'; end if;
 insert into public.business_invitations(business_id, user_id, role, invited_by) values (p_business, p_user, p_role, v_me) returning id into v_id;
 perform public.notify(p_user, 'Company invitation', b.name, '/app/profile/companies/invites');
 return v_id;
exception when unique_violation then
 return null;
end;$$;
revoke execute on function public.invite_to_business(uuid, uuid, text) from public, anon;
grant execute on function public.invite_to_business(uuid, uuid, text) to authenticated;

create function public.answer_business_invitation(p_invitation uuid, p_accept boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); i record; b record; v_conv uuid; v_name text;
begin
 select * into i from public.business_invitations where id = p_invitation and user_id = v_me and status = 'pending' for update;
 if i.id is null then raise exception 'invitation not found' using errcode = 'no_data_found'; end if;
 update public.business_invitations set status = case when p_accept then 'accepted' else 'declined' end, answered_at = now() where id = i.id;
 if not p_accept then return null; end if;
 select * into b from public.businesses where id = i.business_id;
 insert into public.business_members(business_id, user_id, role) values (i.business_id, v_me, i.role) on conflict do nothing;
 v_conv := public.ensure_business_chat(i.business_id);
 insert into public.conversation_members(conversation_id, user_id) values (v_conv, v_me) on conflict do nothing;
 select display_name into v_name from public.profiles where id = v_me;
 perform public.notify(i.invited_by, 'Company joined', coalesce(v_name, '') || ' · ' || b.name, '/app/profile/companies/' || i.business_id);
 return i.business_id;
end;$$;
revoke execute on function public.answer_business_invitation(uuid, boolean) from public, anon;
grant execute on function public.answer_business_invitation(uuid, boolean) to authenticated;

-- The owner removes anyone; anyone else can only leave. Removal also takes them out of the team chat.
create function public.remove_business_member(p_business uuid, p_user uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); b record; v_target text;
begin
 select * into b from public.businesses where id = p_business;
 select role into v_target from public.business_members where business_id = p_business and user_id = p_user;
 if b.id is null or v_target is null or v_target = 'owner' then raise exception 'not allowed' using errcode = '42501'; end if;
 if not (p_user = v_me or b.owner_id = v_me) then raise exception 'not allowed' using errcode = '42501'; end if;
 delete from public.business_members where business_id = p_business and user_id = p_user;
 if b.conversation_id is not null then
  delete from public.conversation_members where conversation_id = b.conversation_id and user_id = p_user and role = 'member';
 end if;
end;$$;
revoke execute on function public.remove_business_member(uuid, uuid) from public, anon;
grant execute on function public.remove_business_member(uuid, uuid) to authenticated;

create function public.set_business_role(p_business uuid, p_user uuid, p_role text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_role not in ('manager','member') then raise exception 'unknown role' using errcode = 'check_violation'; end if;
 if not exists (select 1 from public.businesses where id = p_business and owner_id = (select auth.uid())) then raise exception 'not allowed' using errcode = '42501'; end if;
 update public.business_members set role = p_role where business_id = p_business and user_id = p_user and role <> 'owner';
end;$$;
revoke execute on function public.set_business_role(uuid, uuid, text) from public, anon;
grant execute on function public.set_business_role(uuid, uuid, text) to authenticated;

-- The team list, for people who belong to the company.
create function public.business_team(p_business uuid) returns table(user_id uuid, display_name text, avatar_url text, role text)
language sql stable security definer set search_path='' as $$
 select m.user_id, p.display_name, p.avatar_url, m.role
 from public.business_members m join public.profiles p on p.id = m.user_id
 where m.business_id = p_business
   and exists (select 1 from public.business_members me where me.business_id = p_business and me.user_id = (select auth.uid()))
 order by case m.role when 'owner' then 0 when 'manager' then 1 else 2 end, p.display_name
$$;
grant execute on function public.business_team(uuid) to authenticated;

create or replace function public.notification_title_km(p_title text) returns text language sql immutable set search_path='' as $
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
  when 'Activity joined' then 'មានអ្នកចូលរួមសកម្មភាព'
  when 'Activity spot' then 'មានកន្លែងទំនេរក្នុងសកម្មភាព'
  when 'Activity cancelled' then 'សកម្មភាពត្រូវបានលុបចោល'
  when 'Hours confirmed' then 'ម៉ោងស្ម័គ្រចិត្តត្រូវបានបញ្ជាក់'
  when 'Quote waiting' then 'សម្រង់តម្លៃកំពុងរង់ចាំចម្លើយ'
  when 'Confirm the work' then 'សូមបញ្ជាក់ការងារ'
  when 'Deadline tomorrow' then 'ថ្ងៃស្អែកគឺកំណត់ពេល'
  when 'Availability ends soon' then 'ភាពទំនេរជិតផុតកំណត់'
  when 'Hire again?' then 'ជួលម្តងទៀតទេ?'
  when 'Activity reminder' then 'ការរំលឹកសកម្មភាព'
  when 'Job alert' then 'ការជូនដំណឹងការងារ'
  when 'New identity check' then 'ការពិនិត្យអត្តសញ្ញាណថ្មី'
  when 'New report' then 'របាយការណ៍ថ្មី'
  when 'New dispute' then 'វិវាទថ្មី'
  when 'New project request' then 'សំណើគម្រោងថ្មី'
  when 'New provider application' then 'ពាក្យសុំអ្នកផ្តល់សេវាថ្មី'
  when 'Company invitation' then 'ការអញ្ជើញចូលក្រុមហ៊ុន'
  when 'Company joined' then 'បានចូលក្រុមហ៊ុន'
  else p_title end
$$;

commit;
