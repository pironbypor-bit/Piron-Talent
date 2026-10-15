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
- Trigger functions are executable by anon in the grant list; PostgREST does not expose trigger functions, so this is harmless but untidy. A later migration could revoke it.
- Held payments are locked pending legal advice; nothing handles customer money.
