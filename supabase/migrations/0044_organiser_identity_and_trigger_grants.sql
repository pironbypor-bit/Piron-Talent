-- Piron Work | migration 0044 | two small hardening steps (owner approved 2026-10-16)
-- Run after 0043_mute_team_and_money.sql.
-- 1. Only people with a checked identity (or an admin) can organise a volunteer activity.
-- 2. Trigger functions are not callable by visitors or signed-in people. Triggers still fire: the execute right is checked
--    when a trigger is created, not when it runs.
begin;

do $$
declare d text;
begin
 select pg_get_functiondef('public.create_activity(text, text, text, text, timestamptz, timestamptz, integer, text)'::regprocedure) into d;
 if position('identity check needed' in d) = 0 then
  d := replace(d, 'if p_starts <= now() then',
   'if not exists (select 1 from public.profiles where id = v_me and identity_checked) and not public.is_admin() then raise exception ''identity check needed'' using errcode = ''check_violation''; end if; '
   || 'if p_starts <= now() then');
  execute d;
 end if;
end $$;

do $$
declare r record;
begin
 for r in
  select p.oid::regprocedure as sig
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
 loop
  execute 'revoke execute on function ' || r.sig || ' from public, anon, authenticated';
 end loop;
end $$;

commit;
