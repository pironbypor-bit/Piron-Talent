@AGENTS.md

# Piron Talent

Cambodia-first work and services marketplace (Phnom Penh): SMEs post projects, providers quote, work gets a trackable record,
plus a community feed. Owner: Po Leangpor. Gmail for all Piron accounts: pironbypor@gmail.com. Business plan and schema:
"H:\04. Piron Project\1. Piron Talent\" (plan PDF 2027-2029; schema v1.0 copied to supabase/migrations/0001_init.sql).

## Stack (same as LaunchLab, copied not shared)
Next.js 16 (app router, src/proxy.ts is the middleware), Supabase (Auth, Postgres, RLS; own org under the Piron Gmail),
Tailwind 4, Cloudflare Workers via OpenNext (npm run deploy), own GitHub repo.

## Conventions
- Words: t("English text") is the key (src/lib/i18n). Khmer in src/lib/i18n/km/index.ts. English + Khmer only for now.
- Brand: yellow/amber tokens brand-* in globals.css, dark text, lots of white space. No hype ("guaranteed jobs", "licensed").
- Public marketplace: pages are public unless under /dashboard, /me, /new, /messages (src/lib/supabase/middleware.ts).
- State changes (publish, booking status, verification, reviews, payments) run server-side only; RLS is default deny.
- Check the build exit code before pushing. Secrets live in the Cloudflare dashboard and .env.local, never in the repo.

## Concierge pilot (Phase 1, built 2026-10-10)
- Intake: /post-project and /join write to project_requests / provider_applications (migration 0003), anonymous inserts allowed.
- Admin: /admin needs a row in public.admins; every status change calls an admin_* database function (security definer, checks is_admin()).
- Demo: /demo, /demo/projects, /demo/workspace (the board: Job offer, Skill offer, Share knowledge), /demo/providers/[slug] use fixtures in src/lib/demo/fixtures.ts only. Nothing there is real; keep the "Sample" ribbon.
- Language: Khmer by default for everyone; the header switch sets the "lang" cookie. Browser language is ignored.

## App release 1 (/app, built 2026-10-10)
- Real five-tab app on the database: /app (Workspace posts, Cheer, Keep, comments, Connect), /app/services (providers with
  is_available), /app/providers/[id], /app/jobs (freelance and project only; shifts hidden until legal review), /app/messages,
  /app/profile (edit, avatar, identity check upload, notifications). Reads in src/lib/app/queries.ts, writes in src/lib/app/actions.ts.
- Migration 0004: public read policies, profile fields, saved_providers, avatars and identity buckets, identity_checks,
  start_conversation (consent rule), notification triggers, publish_job, set_my_skills. Migration 0005 adds ID details (legal name, type, number, date of birth) and a selfie to identity_checks; /app/profile/identity is the three-step flow, admins compare both photos with the details at /admin/identity. Approval copies legal name and date of birth into profile_private.
- Anonymous visitors browse; the proxy sends /app/profile, /app/messages, /app/post/new and /app/jobs/new to /login.

## Phase 2 core loop (migration 0006, built 2026-10-10)
- Job offer posts carry scope (deliverables, deadline, remote, budget). Providers with is_available send quotes (price, days, note) from the post page; the author accepts or declines, providers withdraw. Accepting creates project_jobs; provider marks delivered, customer confirms (completed_jobs +1), either cancels before delivery, customer reviews after confirmation. All through security-definer functions; notifications by triggers. UI: src/app/app/post/project-panel.tsx and job-panel.tsx; /app/profile/jobs lists my jobs.

## Plan
Feature, screen and UI plan for 2027: docs/product-plan.md. Mobile app screens from the owner mockup: docs/app-ui-plan.md. Update them when scope changes.

## Order of work (business plan, section 5)
Q1 2027 concierge pilot first: landing page, waitlist/intake forms, manual matching, 20 paid projects before the full marketplace.

## Phase 2, step 2: search, portfolio, reports, disputes (2026-10-10)
- Services: search by name / role line / about / skill (ilike, skills via profile_skills join), remote filter, sort (rated | completed | newest); rating comes from reviews joined on `reviews_subject_id_fkey`.
- Edit profile: Portfolio section (PortfolioEditor in src/app/app/profile/uploads.tsx), max 12 images in the public `portfolio` bucket under `<uid>/`, rows in portfolio_items via addPortfolioItem / removePortfolioItem.
- Migration 0007_reports_disputes.sql (applied): reports.note/resolved_by/resolved_at, admin read policy, `file_report`, `admin_set_report_status`, `open_dispute` (anchored on the job quote), `admin_resolve_dispute` (notifies both sides).
- App: ReportForm (src/app/app/report-form.tsx) on post, provider and job pages; dispute block in job-panel.tsx; admin queues at /admin/reports and /admin/disputes.
- Migration 0008_request_source.sql (applied): project_requests.source and provider_applications.source (slug, 40 chars). Segment pages /for/online-sellers, /for/cafes, /for/students from src/lib/segments.ts; task chips prefill /post-project or /join with source, category and details; /admin shows the source.
- Migration 0009_city_district.sql (applied): profiles.city limited to the list in src/lib/cities.ts, profiles.district (Phnom Penh only), index on (city, is_available). Services and the public directory filter by city; remote providers stay visible in every city.
- Public directory /providers and public profile /providers/[id] (site chrome) share src/app/app/providers/provider-profile.tsx with the app page (base "/app" or ""). sitemap.ts and robots.ts use SITE_URL from src/lib/site.ts (env NEXT_PUBLIC_SITE_URL, fallback Worker URL).
- Migration 0010_email_notifications.sql (applied): BEFORE INSERT trigger on notifications posts to the Brevo API through pg_net, at most one email per person per 15 minutes (notifications.emailed_at), skipped when profile_private.email_notifications is false or when the Vault secret `brevo_api_key` is missing. Khmer titles via notification_title_km(). Settings switch calls set_email_notifications(). Owner adds the key once: select vault.create_secret('<key>', 'brevo_api_key').
- Migration 0011_rehire.sql (applied): posts.invited_provider_id + opens_at; posts_read / posts_read_public hide a post until opens_at unless you are the author or the invited provider; notify_invite trigger ('Project invitation'). Rehire: /app/post/new?rehire=<my post>&to=<provider> seeds the form; createPost sets opens_at = now + 24h unless open_now. "Hire again" on confirmed jobs (My jobs) and on the provider profile (lastConfirmedJobWith).
- Migration 0012_fix_membership_recursion.sql (applied): is_conversation_member and is_business_member are security definer, otherwise the policies that call them recurse ("stack depth limit exceeded" on Messages). Rule: any helper used inside a policy on the same table it reads must be security definer.
- Test run 2026-10-12 with a second account (POR, megickid@gmail.com): quote → accept → deliver → confirm → review → message → dispute → report → rehire all pass. Provider-side steps can be driven from the SQL editor with set_config('request.jwt.claims', ...) + set local role authenticated.
- Public launch prep (2026-10-13): security headers in next.config.ts; /privacy and /terms (plain bilingual text, SECTIONS arrays in the page files); footer links; Cloudflare Web Analytics beacon when NEXT_PUBLIC_CF_ANALYTICS_TOKEN is set. Owner steps (domain, auth URLs, sender domain, WAF rate limits, Pro plan) are in docs/launch-checklist.md.
- Product name is **Piron Work** since 2026-10-14 (APP_NAME in src/lib/brand.ts); code, repo, Worker and Supabase project keep the "piron-talent" names. Domain: app.piron.tech for the app, piron.tech for the company page. Migration 0013 renames the email sender.
- Domains (2026-10-14): piron.tech zone lives in Cloudflare (nameservers beau/millie). app.piron.tech = Worker custom domain (the app). piron.tech = company website on Hostinger WordPress (A 92.112.187.20 and www CNAME, both DNS-only so Hostinger's own certificate works); edit it through hPanel → Websites → piron.tech → WP Admin. Pages Home/About/Contact were created through the WordPress REST API from the logged-in admin session.
- Request templates (2026-10-14): src/lib/app/templates.ts, ten pilot tasks; chips on the Job offer form seed title/body/deliverables/budget/category/remote (fields re-mount on change); ?template=<slug> preselects one. Add a template by appending to TEMPLATES and adding its Khmer strings.
- Migration 0014_fix_quotes_add_policy.sql (applied 2026-10-14): quotes_add used an unqualified post_id inside its project_jobs subquery (bound to the inner table), blocking all quotes once any job was active. Now uses post_has_active_job() (security definer). Rule: qualify columns inside policy subqueries with the policy table name.
- Migration 0015_reliability_signals.sql (applied 2026-10-14): profiles.available_until (7-day switch via set_available_this_week), provider_signals(uuid[]) = median reply minutes over 90 days from messages and invited-post quotes. UI in src/components/signals.tsx; shown on Services, the public directory and the profile; switch on the own profile page (providers only).

## Identity level 2 (migration 0016, built 2026-10-14)
- Still a person who approves. The database adds three hints for the reviewer at /admin/identity: an optional machine-readable line (passport line 2 or ID-card line 1) checked with the ICAO 9303 check digits and against the typed number and birth date (`checks.mrz`: ok, bad_checksum, mismatch, unreadable, or null); other accounts that sent the same ID number (`checks.duplicate_user_ids`, any status, numbers normalised); a number-format hint (`checks.format_ok`: 9 digits for a Khmer ID card, letters plus digits for a passport). Computed by a security-definer BEFORE INSERT trigger, so the browser cannot set them. The live-capture flags (`id_live`, `selfie_live`) are the browser's own observation: the file was saved within two minutes of being chosen.
- src/lib/mrz.ts mirrors the trigger for instant feedback while typing; keep the two in step.

## Notification centre (migration 0017, built 2026-10-14)
- Owner decision: no Telegram or other outside apps; everything in the app. Email stays only as a quiet backup for 'Quote accepted' and 'Work delivered' (the email trigger returns early for every other title).
- /app/notifications is the centre (grouped Today, This week, Earlier). Opening one goes through /app/notifications/go/[id], which marks it read and redirects; those are plain anchors (a full navigation), since a Next Link would client-route through the redirect and show the cached list. The Profile tab keeps a link card with the unread count.
- Live badges: src/components/live-counts.tsx subscribes (Supabase Realtime, tables notifications and messages in the supabase_realtime publication, RLS applies) and re-counts on each change; TopBar and TabBar read the context, and the tab title carries "(n)". Conversation read marks: conversation_members.last_read_at, set by mark_conversation_read(uuid) when a conversation page loads; unread_conversations() feeds the Messages tab badge.
- Next in the notification plan: phone notifications from the installed app (Web Push), scheduled reminders (pg_cron), owner alerts, per-group preferences.

## Phone notifications from the installed app, Web Push (migration 0018, built 2026-10-14)
- Installable: src/app/manifest.ts (start_url /app), icons in public/icons generated from the brand mark (scratchpad script, no library), public/sw.js shows the notification and opens its url on tap; no caching in the service worker.
- Settings → "Notify me on this phone" (src/app/app/settings/push-switch.tsx): permission, register /sw.js, subscribe with the public VAPID key, savePushSubscription stores endpoint and keys in push_subscriptions (own rows only). iPhone needs Add to Home Screen first; the switch explains that.
- Sending: trigger notifications_push (after insert) posts the row plus that person's subscriptions to /api/push with header x-push-secret (Vault secret push_hook_secret). The route (src/app/api/push/route.ts) verifies the secret and uses src/lib/webpush.ts: RFC 8291 aes128gcm encryption and RFC 8292 VAPID on WebCrypto, checked against the RFC 8291 example vectors. Dead subscriptions (404/410) are pruned through prune_push_subscription(endpoint, secret).
- Keys: NEXT_PUBLIC_VAPID_PUBLIC_KEY is a wrangler var; VAPID_PRIVATE_KEY (JWK JSON) and PUSH_HOOK_SECRET are Cloudflare secrets (set with wrangler secret put) and in .env.local; the hook secret is also in the Vault. Rotate all three together.

## Profile hub and companies (migration 0020, built 2026-10-14)
- Profile design A from docs/app-ui-plan.md 4.6: src/app/app/profile/page.tsx is the hub; companies at /app/profile/companies/new and /app/profile/companies/[id] (queries myBusinesses, getBusiness; action createCompany → rpc create_business, which also writes the owner membership since business_members has no insert policy). Posting under a company: /app/jobs/new?business=<id> and /app/post/new?business=<id> add a hidden business_id; RLS checks membership.
- Shell: TopBar has a details-element menu (Notifications, Settings, Log out) next to the bell, the avatar links to Profile, and the fifth tab is Post (/app/post/new). The demo shell shares it; /demo/app/post/new is a chooser.

## Profile for everyone: work record and endorsements (migration 0021, built 2026-10-14)
- /app/providers/[id] already served any profile; it now shows a Work record (confirmed project_jobs via work_record(uuid), both as provider and as customer) and endorsement counts next to skills. profiles.record_public (Settings switch "Show my work record") hides a person's own record and their name on other people's records, so a name appears only when both allow it.
- Endorsements: the review form on a confirmed job lists the provider's skills; the customer ticks up to three, leaveReview calls endorse(job, skills[]) before leave_review. Only skills the provider lists count; one row per job and skill.

## Say hello: message requests (migration 0022, built 2026-10-14)
- The consent rule is unchanged (start_conversation: post author or available provider). When messaging is not open, the profile shows "Say hello" instead of the message box: send_hello(user, body ≤300 chars) writes a message_requests row, notifies 'Message request'. Limits: one pending per pair, five new requests per person per day, 30 days before asking again after a decline (decline is silent).
- Messages tab lists incoming requests with Accept and Not now (answer_hello). Accept creates the conversation with the hello as the first message; piron.skip_notify (transaction-local setting) stops notify_message from notifying the person who just accepted. The sender gets 'Request accepted'. unread_conversations() now adds pending incoming requests, so the Messages badge counts them.
- contact_state(user) returns anon, self, conversation, open, pending, incoming, declined or can_request; ProviderProfile switches on it. Queries contactState and myMessageRequests; actions sendHello and answerHello.
