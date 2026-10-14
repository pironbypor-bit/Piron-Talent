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
