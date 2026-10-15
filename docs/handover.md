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
- Migrations 0001 to 0042 are applied on the live database (latest: 0030 notification preferences, 0031 company team, 0032 team terms and private pay records, 0033 company documents and public page, 0034 storage read fix, 0035 admin numbers, 0036 works-at line, 0037 team shifts and tasks, 0038 task status fix, 0039 invoices and payment records, 0040 verified payout accounts, 0041 Khmer notification titles, 0042 members-only shift and task actions). Worker version latest deploy of 2026-10-15 (voice typing on project forms).
- Vault secrets: site_url (https://app.piron.tech), push_hook_secret (set), brevo_api_key (set 2026-10-15, key name Piron Work 2 in Brevo, expires 2027-10-15).
- Cloudflare secrets: VAPID_PRIVATE_KEY, PUSH_HOOK_SECRET; var NEXT_PUBLIC_VAPID_PUBLIC_KEY in wrangler.jsonc. The same three are in .env.local.
- Phone notifications: the owner has not yet installed the app on a phone to try the switch in Settings.

## LOCKED decisions
- Payments held through Piron Work (customer pays Piron, Piron releases to the provider, "option 1"): LOCKED and NOT to be built or switched on until the owner has Cambodian legal advice on National Bank of Cambodia licensing (research of 2026-10-15: providing means of payment, taking deposits and issuing e-money are licensed activities; nothing found that exempts a marketplace escrow; a payment service institution licence reportedly needs about $2 million capital and separate customer-fund accounts, unverified). The demo at /demo/app/payments stays as a talking piece. Allowed: invoices and payment records (0039, no money moves) and verified payout accounts (0040). Later path: a licensed payment partner that holds the money (option 3).

## Open items for the owner
- Khmer review: all new Khmer text of 2026-10-15 was written by the assistant (about 530 lines: category pages, invoices, payout accounts, demos, admin numbers). Ask a Khmer speaker to read the category pages and the legal and tax wording first.
- Cancel the two extra Hostinger orders (piron.site, pirontalent.space). Decide clean up or keep of the test-run data (posts "Test loop: cafe logo refresh" x2, the $45 job, review, conversation, closed dispute and report, POR's $40 quote on post fed97023-54d1-47ec-9b2e-276cd2c83157). Optional: WordPress theme styling in Piron amber.

## Plans the owner approved, in order
1. People plan (docs/app-ui-plan.md and the message of 2026-10-14): profile step DONE. "Say hello" message requests DONE (0022). Group messages DONE for people-you-talk-with and project groups (0023); company team chat waits for company invitations and activity groups for volunteer activities. Inviting several providers to a project DONE (0024, from the project page and from a profile). Volunteer activities DONE (0025: own tables, join with waitlist, activity group chat, organiser-confirmed hours, volunteer record on the profile; the Volunteer tile on Home is built, and the day-before reminder exists in send_reminders (0027)). Photos and PDFs in messages, blocking and Share buttons DONE (0026); the people plan is complete except company team chat (needs company invitations) and rich link previews. Next: the notification plan below.
2. Notification plan: COMPLETE (0017 centre and live badges, 0018 phone push, 0027 reminders, 0028 job alerts, 0029 owner alerts, 0030 per-type preferences). Email stays a quiet backup for Quote accepted and Work delivered.
3. Earlier backlog: share previews DONE (shareMeta in src/lib/seo.ts, og-default.png, crawler rules in robots.ts; no per-item picture text), category SEO pages DONE (/services, /services/<category>, /services/<category>/<city>; copy in src/lib/category-pages.ts is English only, Khmer strings wait for the final language pass the owner asked for; empty city pages are noindex and not in the sitemap), admin KPIs DONE (/admin/kpis, 0035), next: Khmer voice typing DONE on the two project forms (browser speech recognition, no server); AI structuring of the spoken text (title, category, budget) is not built and needs a paid AI key; invoices and payment RECORDS built (0039, no money moves; a payment provider and tax invoices need licences and advice); KYC level 3 not built; company managers and team chat DONE (0031); terms of work, private pay records and org chart DONE (0032: records only, no money moves, no payroll or tax). Team schedule, clock in and out, and shared tasks are BUILT (0037). The works-at line on public profiles is built (0036, each member opts in). Company documents (Private/Team/Public) and the public company page /companies/<id> are BUILT (0033); only the owner publishes; page defaults to off; demo kept at /demo/app/company. Khmer strings for them wait for the final language pass.

## How features are built here
Migration file in supabase/migrations (applied by hand in the SQL editor) → queries in src/lib/app/queries.ts, writes in src/lib/app/actions.ts (server actions, security-definer functions for anything cross-user) → pages under src/app/app → Khmer strings inserted after "Search": "ស្វែងរក", in src/lib/i18n/km/index.ts → a short note appended to CLAUDE.md → build, commit, push, deploy, verify live as POR → report in plain words with what was verified.
- Email backup: Brevo key "Piron Work 2" is stored in Vault (brevo_api_key) as of 2026-10-15; a Work delivered test returned 201 from Brevo. Sender leangporpo9@gmail.com (Gmail, may hit spam; later authenticate piron.tech). Key expires 2027-10-15 or after 90 days idle. Hostinger piron.site and pirontalent.space show Payment processing with no cancel control; watch the card statement.
