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

## Addendum 2 (Piron Work Space review, 2026-10-15)

Scope: migrations 0045 to 0052 (owner flag and audit log, overview, people and pause, marketplace, errors, feature switches, money, reports).

- **RLS:** all 58 public tables have row level security on. The new tables (audit_log, app_errors, feature_flags, feature_flag_people, finance_entries) have no direct grants for anon or authenticated except SELECT on audit_log and app_errors for the owner policy; everything else goes through functions.
- **Functions:** all 22 space_* functions are executable by authenticated only, every one checks is_owner() itself, and every one sets search_path to empty. The two internal helpers (space_funnel, space_finance_in_month) are not executable by app roles. Rule tests 07 and 09 to 14 prove that a normal account and a visitor get nothing.
- **Anonymous-callable by design:** my_features() (returns only features that are on for everyone) and log_app_error() (error reports from visitors).
- **Found and fixed:** log_app_error could be used to cause many owner alerts with different messages. Now at most 3 alerts an hour in total (patched on the live database and in migration 0049). Reports are capped at 100 a minute and 2000 kept, addresses and long numbers are removed before storing.
- **Accepted limits:** pausing a person blocks the app and server actions but not direct database calls with their own token (needs an auth ban with the service role key). The error table is readable by the owner only, but messages come from users' browsers: they are treated as plain text and never rendered as HTML.
- **Full rule test run:** tests 01 to 14 all match their expected lines after migration 0046 (the only expected difference: test 06 shows Quote waiting x2 and first_run 8 because a real pending quote also qualifies).

## Addendum 3 (Home in three pages, migrations 0053 to 0057, 2026-10-16)

- **RLS and grants:** all public tables have row security on. booking_requests can be read only by the customer, the provider and admins and has no write grants; every change goes through request_booking, answer_booking, answer_counter and cancel_booking (authenticated only, each checks who is calling and the state). booking_make_job, nudge_bookings and expire_bookings cannot be called by app roles. provider_cards is public to read (it is public profile content) and writable only by its owner. All new functions pin an empty search path. No new function is callable by a visitor.
- **Found and fixed:** the private project made by an agreed booking (opens_at infinity, invited provider) would have shown in the Posts feed, the open requests count and the invite list of both people, because authors and invited providers can read it. The queries now hide opens_at infinity in those three places.
- **Booking rules proven by rule test 15:** no self booking, 5 requests a day, one open request per person, blocked or paused people cannot book or be booked, only the provider answers a request, only the customer answers a suggestion, visitors are denied, the booking project is invisible to visitors and visible to the provider, no stray New quote notice, 48 hour expiry.
- **Accepted limits:** a provider can see a customer's request text and budget (intended). Booking spam is limited per customer, not per provider; if one provider is flooded, the owner can pause the sender.
- **Re-run after the notification patches:** tests 04, 10, 14, 15, 16 match their expected lines.
