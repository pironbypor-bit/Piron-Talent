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

## Plan
Feature, screen and UI plan for 2027: docs/product-plan.md. Mobile app screens from the owner mockup: docs/app-ui-plan.md. Update them when scope changes.

## Order of work (business plan, section 5)
Q1 2027 concierge pilot first: landing page, waitlist/intake forms, manual matching, 20 paid projects before the full marketplace.
