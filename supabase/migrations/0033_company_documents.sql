-- Piron Work | migration 0033 | company documents (Private, Team, Public) and the public company page
-- Run after 0032_team_terms_pay.sql in the Supabase SQL editor.
-- Owner decision 2026-10-15: only the owner can publish. A company page is off until the owner turns it on.
-- Private = owner and managers, Team = everyone in the company, Public = anyone, no login (only while the page is on).
begin;

-- 1. Page settings and activities organised by a company
alter table public.businesses
 add column page_public boolean not null default false,
 add column about text check (about is null or length(about) <= 500);

alter table public.activities add column business_id uuid references public.businesses(id) on delete set null;
create index activities_business_idx on public.activities(business_id) where business_id is not null;

-- 2. Reports can point at a company page
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports add constraint reports_target_type_check
 check (target_type in ('post','comment','user','service','job','message','company'));

create or replace function public.file_report(p_type text, p_id uuid, p_reason text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_id uuid; v_exists boolean;
begin
 if v_me is null then raise exception 'not allowed' using errcode='42501'; end if;
 if p_type not in ('post','comment','user','job','message','company') then raise exception 'bad target' using errcode='check_violation'; end if;
 if length(trim(coalesce(p_reason,''))) < 3 then raise exception 'reason is required' using errcode='check_violation'; end if;
 v_exists := case p_type
  when 'post' then exists(select 1 from public.posts where id=p_id)
  when 'comment' then exists(select 1 from public.post_comments where id=p_id)
  when 'user' then exists(select 1 from public.profiles where id=p_id)
  when 'job' then exists(select 1 from public.jobs where id=p_id)
  when 'message' then exists(select 1 from public.messages where id=p_id)
  when 'company' then exists(select 1 from public.businesses where id=p_id and page_public)
 end;
 if not v_exists then raise exception 'target not found' using errcode='no_data_found'; end if;
 if p_type='user' and p_id=v_me then raise exception 'cannot report yourself' using errcode='check_violation'; end if;
 select id into v_id from public.reports where reporter_id=v_me and target_type=p_type and target_id=p_id and status in ('open','reviewing');
 if v_id is not null then return v_id; end if;
 insert into public.reports(reporter_id, target_type, target_id, reason) values (v_me, p_type, p_id, left(trim(p_reason), 1000)) returning id into v_id;
 return v_id;
end;$$;

-- 3. Documents. Rows are written only through the functions below.
create table public.business_documents (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null check (length(name) between 1 and 120),
 path text not null unique check (length(path) <= 300),
 mime text not null check (mime in ('image/jpeg','image/png','image/webp','application/pdf')),
 bytes integer not null check (bytes between 1 and 5242880),
 level text not null default 'private' check (level in ('private','team','public')),
 uploaded_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index business_documents_business_idx on public.business_documents(business_id, created_at desc);
alter table public.business_documents enable row level security;

create function public.can_read_company_doc(b uuid, lvl text) returns boolean language sql stable security definer set search_path='' as $$
 select case lvl
  when 'public' then exists (select 1 from public.businesses x where x.id = b and x.page_public) or public.is_business_member(b)
  when 'team' then public.is_business_member(b)
  else public.is_business_manager(b)
 end
$$;
grant execute on function public.can_read_company_doc(uuid, text) to anon, authenticated;

create policy business_documents_read on public.business_documents for select to anon, authenticated
 using (public.can_read_company_doc(business_id, level));

-- 4. Storage: a private bucket; the first folder is the company id.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('company-files', 'company-files', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create function public.can_use_company_path(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select case when (storage.foldername(p_name))[1] ~ '^[0-9a-f-]{36}$'
  then public.is_business_manager(((storage.foldername(p_name))[1])::uuid) else false end
$$;
grant execute on function public.can_use_company_path(text) to authenticated;

create function public.can_read_company_file(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.business_documents d where d.path = p_name and public.can_read_company_doc(d.business_id, d.level))
$$;
grant execute on function public.can_read_company_file(text) to anon, authenticated;

create policy company_files_add on storage.objects for insert to authenticated
 with check (bucket_id = 'company-files' and public.can_use_company_path(name));
create policy company_files_read on storage.objects for select to anon, authenticated
 using (bucket_id = 'company-files' and public.can_read_company_file(name));
create policy company_files_delete on storage.objects for delete to authenticated
 using (bucket_id = 'company-files' and public.can_use_company_path(name));

-- 5. Writes
create function public.add_company_document(p_business uuid, p_name text, p_path text, p_mime text, p_bytes integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); v_id uuid;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if not public.is_business_manager(p_business) then raise exception 'not allowed' using errcode = '42501'; end if;
 if left(p_path, 37) <> p_business::text || '/' then raise exception 'bad path' using errcode = '22023'; end if;
 if (select count(*) from public.business_documents where business_id = p_business) >= 50 then raise exception 'too many files' using errcode = 'check_violation'; end if;
 insert into public.business_documents(business_id, name, path, mime, bytes, uploaded_by)
 values (p_business, left(trim(p_name), 120), p_path, p_mime, p_bytes, v_me) returning id into v_id;
 return v_id;
end;$$;

-- Only the owner can publish. A manager can move a file between Private and Team, and can pull a public file back.
create function public.set_document_level(p_doc uuid, p_level text) returns void
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); d record;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 if p_level not in ('private','team','public') then raise exception 'bad level' using errcode = '22023'; end if;
 select * into d from public.business_documents where id = p_doc;
 if d.id is null or not public.is_business_manager(d.business_id) then raise exception 'not allowed' using errcode = '42501'; end if;
 if p_level = 'public' and not public.is_business_owner(d.business_id) then raise exception 'only the owner can publish' using errcode = '42501'; end if;
 update public.business_documents set level = p_level, updated_at = now() where id = p_doc;
end;$$;

-- Returns the storage path so the server can remove the file itself.
create function public.delete_company_document(p_doc uuid) returns text
language plpgsql security definer set search_path='' as $$
declare v_me uuid := (select auth.uid()); d record;
begin
 if v_me is null then raise exception 'sign in first' using errcode = '42501'; end if;
 select * into d from public.business_documents where id = p_doc;
 if d.id is null or not public.is_business_manager(d.business_id) then raise exception 'not allowed' using errcode = '42501'; end if;
 delete from public.business_documents where id = p_doc;
 return d.path;
end;$$;

create function public.set_company_page(p_business uuid, p_about text, p_public boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_business_owner(p_business) then raise exception 'not allowed' using errcode = '42501'; end if;
 update public.businesses set about = nullif(left(trim(coalesce(p_about, '')), 500), ''), page_public = coalesce(p_public, false) where id = p_business;
end;$$;

create function public.link_activity_company(p_activity uuid, p_business uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_business_manager(p_business) then raise exception 'not allowed' using errcode = '42501'; end if;
 update public.activities set business_id = p_business where id = p_activity and organiser_id = (select auth.uid());
end;$$;

-- 6. What the public company page reads. Null when the page is off and the reader is not in the company.
create function public.company_public(p_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select case when b.id is null or not (b.page_public or public.is_business_member(b.id)) then null else jsonb_build_object(
  'id', b.id, 'name', b.name, 'kind', b.description, 'city', b.city, 'about', b.about, 'is_public', b.page_public,
  'owner_checked', coalesce((select p.identity_checked from public.profiles p where p.id = b.owner_id), false),
  'posts', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'kind', x.kind::text, 'city', x.city, 'budget_min', x.budget_min, 'budget_max', x.budget_max, 'created_at', x.created_at) order by x.created_at desc)
    from (select * from public.posts po where po.business_id = b.id and po.status = 'published' and (po.opens_at is null or po.opens_at <= now()) order by po.created_at desc limit 8) x), '[]'::jsonb),
  'jobs', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'city', x.city, 'pay_amount', x.pay_amount, 'pay_unit', x.pay_unit, 'created_at', x.created_at) order by x.created_at desc)
    from (select * from public.jobs j where j.business_id = b.id and j.status = 'published' order by j.created_at desc limit 8) x), '[]'::jsonb),
  'activities', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'place', x.place, 'city', x.city, 'starts_at', x.starts_at, 'capacity', x.capacity,
      'joined', (select count(*) from public.activity_members m where m.activity_id = x.id and m.status in ('joined','confirmed'))) order by x.starts_at)
    from (select * from public.activities a where a.business_id = b.id and a.status = 'open' and a.ends_at > now() order by a.starts_at limit 8) x), '[]'::jsonb),
  'documents', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'mime', d.mime, 'bytes', d.bytes) order by d.created_at desc)
    from public.business_documents d where d.business_id = b.id and d.level = 'public'), '[]'::jsonb)
 ) end
 from (select p_id as id) q left join public.businesses b on b.id = q.id
$$;

create function public.public_company_ids() returns setof uuid language sql stable security definer set search_path='' as $$
 select id from public.businesses where page_public order by created_at desc limit 5000
$$;

revoke execute on function public.add_company_document(uuid, text, text, text, integer) from public, anon;
revoke execute on function public.set_document_level(uuid, text) from public, anon;
revoke execute on function public.delete_company_document(uuid) from public, anon;
revoke execute on function public.set_company_page(uuid, text, boolean) from public, anon;
revoke execute on function public.link_activity_company(uuid, uuid) from public, anon;
grant execute on function public.add_company_document(uuid, text, text, text, integer) to authenticated;
grant execute on function public.set_document_level(uuid, text) to authenticated;
grant execute on function public.delete_company_document(uuid) to authenticated;
grant execute on function public.set_company_page(uuid, text, boolean) to authenticated;
grant execute on function public.link_activity_company(uuid, uuid) to authenticated;
grant execute on function public.company_public(uuid) to anon, authenticated;
grant execute on function public.public_company_ids() to anon, authenticated;

commit;
