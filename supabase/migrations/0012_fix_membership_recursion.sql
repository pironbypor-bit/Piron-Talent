-- Piron Talent | migration 0012 | fix: membership helpers must bypass row security, or the policies that call
-- them recurse ("stack depth limit exceeded" on the Messages list). Found in the 2026-10-12 test run.
-- Run after 0011_rehire.sql in the Supabase SQL editor.
begin;

create or replace function public.is_conversation_member(c uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.conversation_members where conversation_id=c and user_id=(select auth.uid()))
$$;
revoke execute on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create or replace function public.is_business_member(b uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.business_members where business_id=b and user_id=(select auth.uid()))
$$;
revoke execute on function public.is_business_member(uuid) from public, anon;
grant execute on function public.is_business_member(uuid) to authenticated;

commit;
