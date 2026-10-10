-- Piron Talent | migration 0005 | identity check with details and a selfie
-- Run after 0004. The identity_checks row now carries what the person typed from their ID and a second photo.
-- Only the person and admins can read it (policies from 0004); nothing here is ever shown on a public profile.
begin;

alter table public.identity_checks
 add column legal_name text check (legal_name is null or length(legal_name) between 1 and 120),
 add column id_type text check (id_type is null or id_type in ('national_id','passport','other')),
 add column id_number text check (id_number is null or length(id_number) between 3 and 40),
 add column date_of_birth date check (date_of_birth is null or date_of_birth between date '1900-01-01' and current_date),
 add column selfie_path text;

alter table public.profile_private add column legal_name text check (legal_name is null or length(legal_name) <= 120);

-- On approval, the legal name and date of birth move to the private profile; the ID number stays on the check only.
create or replace function public.admin_review_identity(p_id uuid, p_status public.identity_status, p_note text)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid; v_name text; v_dob date;
begin
 perform public.assert_admin();
 update public.identity_checks set status=p_status, note=p_note, reviewed_by=(select auth.uid()), reviewed_at=now()
  where id=p_id returning user_id, legal_name, date_of_birth into v_user, v_name, v_dob;
 if v_user is null then raise exception 'check not found' using errcode='no_data_found'; end if;
 update public.profiles set identity_checked=(p_status='checked') where id=v_user;
 if p_status='checked' then
  insert into public.profile_private(user_id, legal_name, date_of_birth) values (v_user, v_name, v_dob)
  on conflict (user_id) do update set legal_name=coalesce(excluded.legal_name, public.profile_private.legal_name),
   date_of_birth=coalesce(excluded.date_of_birth, public.profile_private.date_of_birth), updated_at=now();
 end if;
 insert into public.notifications(user_id, title, body, link_path)
 values (v_user, case when p_status='checked' then 'Identity checked' else 'Identity check rejected' end, p_note, '/app/profile');
end;$$;

commit;
