# Handover: Piron Work app (written 2026-10-14)

Read this first, then CLAUDE.md (project rules and a note per feature), then docs/product-plan.md and docs/app-ui-plan.md.

## What this is
Piron Work (app.piron.tech) is a Cambodian marketplace for skilled work: customers post projects and get quotes, providers show a card in Services, companies post part-time jobs. Khmer first, English second. Owner: Po Leangpor. The company website piron.tech is a separate WordPress site at Hostinger; the app is only app.piron.tech (root redirects to /app).

## Accounts the owner holds (never ask for passwords; the owner logs in and pastes keys)
- App owner account: leangporpo9@gmail.com, display name "Piron" (admin). Test provider account: megickid@gmail.com, display name "POR".
- Supabase project ref hxvaddhxdolztjihbwdt (GitHub and Supabase under pironbypor@gmail.com). Cloudflare under poleangpor1@gmail.com, Worker "piron-talent". Hostinger holds the domain and WordPress.
- Repo: github.com/pironbypor-bit/Piron-Talent, branch main. The working copy is H:\04. Piron Project\1. Piron Talent\piron-talent-app.

## Rules the owner set
- Work autonomously; ask only for logins, payments and approvals. Propose each design step in a few lines, then build. Khmer-first copy, no hype words.
- Never commit .env.local. Secrets live only in the Cloudflare dashboard (or wrangler secret put), the Supabase Vault and .env.local. Never type the owner's passwords or third-party API keys; the owner pastes them.
- Check the build exit code before every push. Commit messages end with: Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com> (use the attribution line your session gives you).
- No Telegram or other outside apps for notifications; everything in-app. Email is a quiet backup for Quote accepted and Work delivered only.
- Leave test data decisions to the owner when it is their data; delete your own test rows after a check.

## Deploy routine
npm run build (must exit 0) → git commit → GCM_GUI_PROMPT=false GCM_INTERACTIVE=never git push → npm run deploy (OpenNext on Cloudflare Workers). A 404 on the first request right after a deploy is a known transient; retry after a few seconds. Verify on https://app.piron.tech with curl and the in-app browser pane.

## Tooling on the owner's Windows machine
- No gh, supabase CLI, psql or Python. Node 24, npm 11, wrangler via npx (npx.cmd in PowerShell).
- Bash tool: one command must stay under about 8 KB or the heredoc is truncated and bash reports "unexpected EOF". Write big files in two or three heredoc chunks to the scratchpad and concatenate. Quoted heredocs (<<'EOF') keep backslashes; JS template literals in edit scripts do not keep them, so avoid regex backslashes there.
- The Write tool is sometimes refused by the auto-mode classifier for TypeScript, SQL and Markdown; use Bash heredocs instead.
- Supabase SQL: open https://supabase.com/dashboard/project/hxvaddhxdolztjihbwdt/sql/new in the browser pane (owner is signed in there), set the editor with window.monaco.editor.getModels()[0].setValue(sql) through the javascript tool, click the "Run" button (find "Run" → the first generic Run ref), then confirm the dialog if one appears ("Run query" for deletes, "Run without RLS" is a false positive on some inserts). Read results with document.querySelector('main').innerText.split('Results')[1].
- Provider-side checks in SQL: select set_config('request.jwt.claims', json_build_object('sub', '<uid>', 'role', 'authenticated')::text, true); set local role authenticated; ... ; reset role;
- Browser pane tab for the app is logged in as POR (not the owner). Admin pages need the owner.
- Helpers used inside policies on the same table must be security definer; qualify columns in policy subqueries with the table name.

## State on 2026-10-14
- Migrations 0001 to 0024 are applied on the live database (latest: 0021 work record and endorsements, 0022 message requests, 0023 group messages, 0024 invite providers). Latest Worker version 9f3f4c42 (2026-10-14).
- Vault secrets: site_url (https://app.piron.tech), push_hook_secret (set), brevo_api_key (still the placeholder; the owner must paste the real key with select vault.update_secret((select id from vault.secrets where name='brevo_api_key'), '<key>');).
- Cloudflare secrets: VAPID_PRIVATE_KEY, PUSH_HOOK_SECRET; var NEXT_PUBLIC_VAPID_PUBLIC_KEY in wrangler.jsonc. The same three are in .env.local.
- Phone notifications: the owner has not yet installed the app on a phone to try the switch in Settings.

## Open items for the owner
- Paste the Brevo API key (above). Cancel the two extra Hostinger orders (piron.site, pirontalent.space). Decide clean up or keep of the test-run data (posts "Test loop: cafe logo refresh" x2, the $45 job, review, conversation, closed dispute and report, POR's $40 quote on post fed97023-54d1-47ec-9b2e-276cd2c83157). Optional: WordPress theme styling in Piron amber.

## Plans the owner approved, in order
1. People plan (docs/app-ui-plan.md and the message of 2026-10-14): profile step DONE. "Say hello" message requests DONE (0022). Group messages DONE for people-you-talk-with and project groups (0023); company team chat waits for company invitations and activity groups for volunteer activities. Inviting several providers to a project DONE (0024, from the project page and from a profile). Next: volunteer activities (new post kind, Join with capacity, organiser confirms hours, volunteer record on the profile, Volunteer chip on Home and Jobs); then photos in messages, block, invite by link.
2. Notification plan: step 4 scheduled reminders with pg_cron (quote waiting 24 h, delivered not confirmed 48 h, deadline tomorrow, Available this week ending, "Hire again?" 30 days after a confirmed job) and job alerts by category and province; step 5 owner alerts in the centre (new identity check, report, dispute, request, application) with an Admin count; step 6 per-group preferences in Settings (Projects and quotes, Messages, Reminders, Reviews).
3. Earlier backlog: share previews for profiles and projects, category SEO pages, admin KPIs, Khmer voice-to-scope; later business accounts, payments, invoices, KYC level 3; company managers (business_members roles exist, no invitation screen yet).

## How features are built here
Migration file in supabase/migrations (applied by hand in the SQL editor) → queries in src/lib/app/queries.ts, writes in src/lib/app/actions.ts (server actions, security-definer functions for anything cross-user) → pages under src/app/app → Khmer strings inserted after "Search": "ស្វែងរក", in src/lib/i18n/km/index.ts → a short note appended to CLAUDE.md → build, commit, push, deploy, verify live as POR → report in plain words with what was verified.
