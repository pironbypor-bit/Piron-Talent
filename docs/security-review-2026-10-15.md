# Security and correctness review, 2026-10-15

Scope: everything built from migration 0032 to 0041 (team terms and pay, company documents and public page, admin numbers, works-at, team shifts and tasks, invoices, payout accounts, category pages, share previews).

## Checked against the live database
- Every table in schema public has row security on: none missing.
- Every security definer function has a fixed search_path: none missing.
- Functions anonymous visitors can run (40 definer functions): reviewed the ones that read data (business_team, business_terms, contact_state, activity_stats, volunteer_record, work_record, is_business_manager, company_public, profile_works_at, is_payout_verified). Each returns nothing private without a signed-in member or owner, or respects record_public / page_public. The rest are trigger functions or yes/no helpers.
- Anonymous policies: only intended public reads (posts, jobs, profiles, categories, portfolio, reviews, public company files and rows) and the two intake inserts (project requests, provider applications).
- Storage: company-files is private, 5 MB, images and PDF only; a visitor can read a file only while its row is Public and the company page is on.

## Tested with rolling-back database tests
- Documents: manager cannot publish, member and outsider see only what the level allows, visitor sees Public only while the page is on.
- Shifts and tasks: member sees only their own, cannot plan or delete, cannot clock a shift outside its window or someone else's.
- Invoices: only the provider issues (capped at the agreed price), only the customer marks paid, only the provider confirms or voids, no change after received.
- Payout accounts: non-admin cannot approve; any change returns to pending; verified needs a checked identity.

## Found and fixed
1. 0038: a member could change the status of an unassigned task (NULL comparison passed the check).
2. 0034: deleting a company document left the file in storage (select rule hid it after the row was gone).
3. 0042: a person removed from a company could still change an assigned task or clock a shift.

## Left as is, with reasons
- npm audit: 4 high findings, all the glob CLI command injection reached through @opennextjs/cloudflare build tooling. Build time only; not in the running Worker. Do not force a fix without testing the deploy.
- Trigger functions were executable by anon in the grant list (harmless, PostgREST does not expose them). Closed by migration 0044; triggers verified to still fire.
- Held payments are locked pending legal advice; nothing handles customer money.

## Live checks added 2026-10-16 (rolling-back tests)
- Volunteer waiting list: second person waits, is promoted when the first leaves, gets the Activity spot notification and joins the chat.
- Reminders: all six kinds fire once (quote waiting, confirm the work, deadline tomorrow, availability ending, hire again, activity reminder to organiser and member); a second run sends nothing.
- Mute groups: a muted group drops the notification, other groups still arrive.
- Organiser rule: unchecked identity is refused, checked is allowed.

## Addendum 2026-10-15 (found while building Piron Work Space step 2)

- **Fixed (migration 0046):** authenticated users had UPDATE on every column of profiles, and the row policy only checked 'own row'. Anyone could set their own identity_checked = true or completed_jobs = 99 through the API. Now only the profile editor columns can be written directly; identity_checked and completed_jobs change only through security definer functions. Rule test 08 covers it. Checked the live data first: no profile had identity_checked set outside the review flow (identity checked count was 0 on the owner overview).
- **Also reviewed:** every other table with an UPDATE policy (businesses, jobs, notifications, portfolio_items, posts, profile_private, quotes, saved_*, services). None has a trust column a user could abuse; quotes and services keep their status through WITH CHECK. Tables without an UPDATE policy are default-deny.
- **Lesson:** after any new table or column that holds a trust value (checked, paused, counts, status set by staff), grant UPDATE by column, not by table.
