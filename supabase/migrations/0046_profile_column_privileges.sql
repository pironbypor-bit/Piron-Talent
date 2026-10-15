-- Piron Work | migration 0046 | profile columns people may change themselves
-- Found 2026-10-15: authenticated had UPDATE on every profile column, and the row policy only checks "own row",
-- so anyone could set identity_checked = true or completed_jobs = 99 on their own profile through the API.
-- Now only the columns the profile editor uses can be written directly. identity_checked is changed by
-- admin_review_identity and completed_jobs by confirm_completion (both security definer), so they keep working.
begin;

revoke update on public.profiles from anon, authenticated;
grant update (display_name, username, avatar_url, bio, city, country, district, is_available, available_until, price_from, primary_category_id, record_public, remote, role_line)
 on public.profiles to authenticated;

commit;
