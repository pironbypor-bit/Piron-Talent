# Piron Talent: feature and UI plan, 2027

Source: Comprehensive Business Plan (October 2026), schema v1.0 and migrations 0002-0003. This plan turns the plan's
roadmap (section 5), marketing funnel (section 6), KPIs (section 12) and exclusions into screens, data and build order.
Dates are targets, not commitments. Status as of 2026-10-10.

## 1. Rules the product follows

1. North star: completed paid work by repeat customers. Every screen either helps a job get done or helps it happen again.
2. One city (Phnom Penh), four launch categories: creative and marketing, IT and technology, documents and translation,
   admin and data entry. Regulated categories (legal, tax, audit, electrical, staffing) stay hidden until legal clearance.
3. Every transaction has an owner, a scope, a budget, a cancellation rule and a dispute path.
4. Three separate labels, never mixed: identity checked, competence shown by completed work and reviews,
   professional licence (only after the regulator review in section 10 of the plan).
5. Out of scope for 2027: custodial wallet or escrow, automated qualification approval, public personal ID, algorithmic
   feed, native apps, shift placement before legal clearance.
6. Engineering: RLS default deny, state changes only in server code or security-definer functions, secrets outside the repo,
   build exit code checked before every push.
7. Language: Khmer first for everyone, English via the header switch. English UI terms stay consistent (glossary, section 4.6).
   No hype words ("guaranteed", "licensed" without proof, "best").

## 2. Phases and gates

| Phase | When | What ships | Gate to move on (from the plan) |
|---|---|---|---|
| 0 Foundation | Oct 2026 | Repo, Supabase (Singapore), schema 0001-0003, Worker, landing page | Done except Worker deploy |
| 1 Concierge pilot | Q1 2027 | Khmer/English landing, two intake forms, accounts, admin matching, demo, SEO test pages, owner notifications, KPI counters | 20 genuine paid projects completed, repeat buyers appear, support time per job manageable |
| 2 Web marketplace | Q2 2027 | Profiles and portfolio, project posts with structured scope, quotes, accept, delivery confirmation, completion record, reviews, messaging with consent, notifications, search, reports and moderation, disputes, identity check review | Legal sign-off and a usable end-to-end transaction flow |
| 3 Repeat and subscriptions | Q3 2027 | Saved providers, one-tap rehire, request templates, business accounts and seats, Business and Business Pro plans, payment references from a licensed provider, AI scope helper | Evidence of 90-day repeat purchase |
| 4 Expansion | Q4 2027 | More categories after clearance, scheduling and availability, provider analytics, team tools, Workspace board | Fill rate and support quality stay healthy |

## 3. Feature inventory

Status: done, next (this phase), later. "Server" names where the state change lives.

### 3.1 Phase 1, concierge pilot

| Feature | Purpose | Data | Server | Status |
|---|---|---|---|---|
| Landing page, Khmer first | Explain the offer, two calls to action | categories | none | done |
| Post a project form | Capture demand without an account | project_requests | server action, anon insert policy | done |
| Join as a provider form | Capture supply | provider_applications | server action | done |
| Email and password accounts | Owner admin login; later customers and providers | auth, profiles | Supabase Auth | done |
| Admin lists, match, record completed job | Run the pilot by hand | pilot_jobs, admin_* functions | security definer functions | done |
| Demo walkthrough and marketplace preview | Sales visits, provider recruitment | fixtures only | none | done |
| Owner notification on new request or application | Reply within one working day | none | Telegram bot or email from a database webhook | next |
| Request source and loss reason fields | The CRM the plan asks for (section 7) | project_requests.source, closed_reason | admin_set_request | source done (0008); loss reason next |
| KPI counters on /admin | Weekly report: qualified requests, fill rate, response time, completed jobs, repeat | views over pilot tables | SQL views | next |
| Three segment landing pages | Paid acquisition tests: online sellers, cafes and retail, student freelancers | static copy + same forms with source set | none | done 2026-10-10, Khmer copy awaits owner review |
| Category SEO pages | "hire photographer Phnom Penh" style pages | categories, static copy | none | next |
| Rate limiting and spam control | Protect anonymous forms | Cloudflare rate limiting rules on /post-project and /join | Cloudflare | next |
| Analytics events | Measure the funnel (section 3.7 below) | event table or Cloudflare Web Analytics | server action | next |
| Khmer copy review workflow | Owner edits km/index.ts; show a missing-translation list in dev | none | none | next |

### 3.2 Phase 2, web marketplace

| Feature | Purpose | Data (exists unless noted) | Server | Status |
|---|---|---|---|---|
| Roles: customer, provider, both | Right dashboard and actions per person | profiles, profile_private | profile edit policy | done (is_available flag; no separate role screens) |
| Provider profile and portfolio | Proof of work, the plan's main trust signal | profiles, profile_skills, portfolio_items, "portfolio" bucket | owner policies exist | done |
| Identity check | "Identity checked" label after manual review of an ID photo | new: identity_checks (private bucket, status, reviewed_by) | admin function | done (manual review, level 1) |
| Project post with structured scope | Title, category, deliverables, budget range, deadline, on-site or remote | posts (kind need_help) + new columns: deliverables, deadline, remote | posts policies exist; publish via server | done |
| Quotes | Price, days, note; one per provider per post | quotes | insert policy exists; accept, decline, withdraw via new functions | done |
| Accept quote and start job | Turns a quote into a work record | new: project_jobs (post, quote, status, agreed price, delivered_at, confirmed_at) | function accept_quote | done |
| Delivery and confirmation | Provider marks delivered, customer confirms, job becomes completed | project_jobs | functions mark_delivered, confirm_completion | done |
| Reviews after completion only | Reputation that cannot be bought | reviews (extend to project_jobs) | function leave_review | done |
| Messaging with consent | Conversation opens only when a quote exists or the customer invites | conversations, conversation_members, messages | function open_conversation | done |
| Notifications | New quote, accepted, delivered, message, review | notifications | written by the functions above | done; email through Brevo from a trigger (0010), needs the Vault key |
| Search and filters | Find providers by category, skill, city, remote, rating | profiles, profile_skills, services | SQL + indexes | done (city filter and public directory 2026-10-12) |
| Reports and moderation queue | Unlawful requests, fake profiles, abuse | reports | admin functions | done |
| Disputes | Either party opens, admin resolves | disputes | insert policy exists; admin functions | done |
| Business dashboard (basic) | Owner sees the business's projects and spend | businesses, business_members | existing policies | later |
| Admin KPIs | Section 12 metrics by week and cohort | views | SQL views | later |

### 3.3 Phase 3, repeat and subscriptions

| Feature | Purpose | Data | Server | Status |
|---|---|---|---|---|
| Saved providers and one-tap rehire | 90-day repeat is the validation target | new: saved_providers | insert policy | saved done; rehire later |
| Request templates | "Same as last month" | new: request_templates | owner policies | later |
| Business accounts, seats, roles | Business and Business Pro | businesses, business_members, plans, business_subscriptions | admin or webhook functions | later |
| Payments through a licensed Cambodian provider | Record references and status only, no custody | payment_records | webhook handler with signature check | later |
| Invoices and records export | Repeat B2B accounts need paperwork | project_jobs, payment_records | server-rendered PDF | later |
| AI scope helper | Turns a vague request into a clear scope in Khmer or English | none (stateless) | server action calling the model API | later |

### 3.4 Phase 4, expansion

Scheduling and availability (service_availability, bookings), provider analytics (response time, win rate, repeat
rate), team tools, Workspace board post types (Job offer, Skill offer, Share knowledge; Hire shift after clearance) with Cheer, Keep and
Connect, category expansion after the legal workplan clears each category.

### 3.5 Trust and safety across phases

- Request screening before anything is public: no identity or banking secrets requested, no unlawful work.
- Three labels only: Identity checked (green pill), completed jobs count, reviews. "Licensed" appears only after the
  professional verification process exists and a regulator check passed.
- Report button on every profile, post, quote and message. Dispute entry on every completed or in-progress job.
- Admin can hide a profile or post; hidden items keep their records.
- Private data (phone, address, ID photos) in profile_private and private buckets; never on public pages.

### 3.6 Payments position (section 4 and 9 of the plan)

Phase 1 and 2: the customer pays the provider directly; the platform records the agreed price and completion.
Phase 3: a licensed provider (ABA PayWay or KHQR through a licensed PSP) for the platform fee and subscriptions, with
payment_records holding references and webhook-confirmed status only. No wallet, no escrow, no custody.

### 3.7 Measurement: events and KPIs

Events (name, when): request_submitted, provider_applied, request_contacted, request_matched, job_completed,
quote_sent, quote_accepted, delivery_confirmed, review_left, rehire_started, subscription_started.

| KPI (plan section 12) | Built from | Target |
|---|---|---|
| Qualified request fill rate | matched / qualified requests | 70%+ in pilot |
| Time to qualified response | first contacted_at minus created_at | under 24 hours for digital categories |
| Completion rate | completed / matched | 50%+ of qualified requests |
| 90-day repeat buyer rate | customers with a second completed job within 90 days | 30%+ |
| Disputed transactions | disputes / completed jobs | under 5% |
| Contribution per booking | fee minus processing and support cost | positive |
| Subscription churn | cancelled / active, monthly | track by cohort |

## 4. UI design

### 4.1 Look

- Colour: white background, ink #1c1917 for text, ink-muted #57534e for secondary text. Amber (brand-500 #f59e0b) is
  used only for the primary action, small labels and the current step. Stone-200 borders, 16px radius on cards, 12px on
  inputs. Status colours: amber new, neutral in progress, green completed or approved, red rejected or cancelled.
- Type: load Noto Sans Khmer and Inter with next/font (today the page relies on system fonts, which renders Khmer
  inconsistently on Android). Base 17px on phones, 16px on desktop. Khmer line-height 1.7, English 1.5. Scale: 14, 16, 18,
  20, 24, 30, 36, 48. Headlines bold, tight tracking; body regular.
- Space: 16px side gutters, 8px grid, generous vertical rhythm (sections 64px apart on desktop, 48px on phones).
  Content column 720px, lists and admin 960px, admin detail 720px.
- Imagery: real portfolio work uploaded by providers, shown in 4:3 tiles with a caption. No stock photos, no generated
  faces. Illustrations, if any, are flat and amber or stone.

### 4.2 Layout and navigation

| Area | Who | Navigation |
|---|---|---|
| Public | everyone | Header: brand, language switch, Log in. Pages: Home, Find providers (Phase 2), Projects (Phase 2), Demo |
| Account | signed in | Phone: bottom bar with Home, Projects, Messages, Me. Desktop: left rail with the same plus Saved providers and Billing (Phase 3) |
| Business | business members | Same as account plus Team and Billing |
| Admin | admins | Left rail: Requests, Applications, Jobs, Verifications, Reports, Disputes, KPIs |

Phones first: every page is designed at 375px, then widened. Primary action is always reachable with one thumb
(bottom of the form or a sticky bar on long pages).

### 4.3 Components

Existing: Button (primary, secondary), Field, Notice, Pill, PageTitle, Avatar, Stars, PortfolioGrid.
To add in Phase 2: Card, ListRow, Tabs, BottomSheet (phone) and Dialog (desktop), Stepper for the job timeline
(Quote, Accepted, Delivered, Confirmed, Reviewed), EmptyState with one action, Skeleton rows, Toast, PriceInput with
USD prefix, CategoryPicker (Khmer label with English under it), FileDrop for portfolio and ID photos, ReportButton.

### 4.4 States every screen defines

Empty (one sentence and one action), loading (skeleton, no spinner walls), error (Notice with a retry), success
(inline, not a redirect to a dead page), and permission denied (plain "Not allowed." with a way back).

### 4.5 Forms

Server validation is the source of truth; browser validation is off so messages stay in the chosen language. Errors sit
under the field, entered values are kept, the first error is scrolled into view. Optional fields say "(optional)" in
the label; nothing is marked with an asterisk. Phone numbers accept Khmer and Latin digits. Money is USD with two
decimals; KHR appears only in Phase 3 if the payment provider needs it.

### 4.6 Words: the glossary

English is the key in code, Khmer is what most people see. Keep these pairs everywhere.

| English | Khmer |
|---|---|
| Project | គម្រោង |
| Request | សំណើ |
| Quote | សម្រង់តម្លៃ |
| Provider | អ្នកផ្តល់សេវា |
| Customer | អតិថិជន |
| Accept / Accepted | ទទួលយក / បានទទួលយក |
| Delivered | បានប្រគល់ |
| Completed | បានបញ្ចប់ |
| Review | ការវាយតម្លៃ |
| Hire again | ជួលម្តងទៀត |
| Identity checked | បានពិនិត្យអត្តសញ្ញាណ |
| Portfolio | ស្នាដៃ |
| Dispute | វិវាទ |

Tone: friendly, clear, credible. Short sentences. Say what happens next and when ("We reply within one working day").
Never promise jobs or income.

## 5. Screens

Route, who it is for, what it must do. Phase 1 screens exist; the rest are the Phase 2 and 3 build list.

### 5.1 Public

| Route | Phase | Purpose and key elements |
|---|---|---|
| / | 1 | Headline, one sentence, two cards (Post a project, Join as a provider), how it works, categories, sample-project link |
| /post-project, /join | 1 | Intake forms (section 4.5), thank-you state with what happens next |
| /demo, /demo/project, /demo/providers/[slug] | 1 | Sample walkthrough, interactive quotes, provider profile; "Sample" ribbon on every page |
| /for/online-sellers, /for/cafes, /for/students | 1 | Segment landing pages for the three paid tests; same forms with source set |
| /hire/[category] | 1 | SEO page per category: what people hire for, typical price range once data exists, form |
| /providers, /providers/[username] | 2 | Directory with filters; public profile: identity label, completed jobs, reviews, portfolio, skills, Request a quote |
| /projects, /projects/[id] | 2 | Open projects for providers (signed-in only to quote); project page with scope, budget, quotes count, Send a quote |
| /login, /signup, /reset-password | 1-2 | Email and password; Telegram or phone login considered for Phase 2 if sign-up drop-off is high |

### 5.2 Customer

| Route | Phase | Purpose and key elements |
|---|---|---|
| /dashboard | 1 | Your requests and application with status; later: active jobs, messages, saved providers |
| /projects/new | 2 | Structured scope form: title, category, deliverables, budget range, deadline, on-site or remote, photos |
| /projects/[id]/quotes | 2 | Compare quotes side by side: price, days, provider card, note; Accept with a confirmation sheet |
| /jobs/[id] | 2 | Job timeline (Stepper), agreed price, Delivered and Confirm buttons, Open a dispute, Leave a review after completion |
| /messages, /messages/[id] | 2 | Conversations tied to a project; opens only after a quote or an invitation |
| /saved | 3 | Saved providers with Hire again |
| /business, /business/team, /business/billing | 3 | Business profile, seats and roles, plan and payment references |

### 5.3 Provider

| Route | Phase | Purpose and key elements |
|---|---|---|
| /me/profile | 2 | Display name, role line, about, city, skills, categories, availability toggle, portfolio upload |
| /me/identity | 2 | Upload ID photo to a private bucket; status Pending, Checked, Rejected; nothing shown publicly except the label |
| /me/quotes | 2 | Quotes sent, status, withdraw while pending |
| /me/jobs | 2 | Active and completed jobs, Mark delivered |
| /me/services | 4 | Fixed-price services with availability (services, service_availability, bookings) |
| /me/stats | 4 | Response time, win rate, repeat rate |

### 5.4 Admin

| Route | Phase | Purpose and key elements |
|---|---|---|
| /admin | 1 | Requests, applications, completed-jobs count; add weekly KPI strip |
| /admin/requests/[id] | 1 | Detail, status and note, match with a provider, job status, agreed price |
| /admin/verifications | 2 | Identity check queue with the uploaded photo, approve or reject with reason |
| /admin/reports, /admin/disputes | 2 | Queues with status, assignee, resolution text; hide or restore content |
| /admin/kpis | 2 | Section 3.7 metrics by week and by cohort, export CSV |

## 6. Technical plan

Migrations ahead (each with RLS and functions, state changes server-side):

- 0004 pilot operations: source and closed_reason on project_requests, KPI views, notification outbox table read by a
  Telegram or email worker.
- 0005 marketplace core: project_jobs, posts scope columns, functions accept_quote, decline_quote, withdraw_quote,
  mark_delivered, confirm_completion, leave_review, open_conversation; notification writes inside those functions.
- 0006 identity checks: identity_checks table, private "identity" bucket, admin review function, "Identity checked" flag
  on profiles maintained by trigger.
- 0007 repeat and billing: saved_providers, request_templates, subscription functions, payment webhook log.

Platform: Cloudflare Worker (OpenNext) for the app; Cloudflare rate limiting on form routes; a second Supabase project
as staging before Phase 2; nightly backups from the Supabase dashboard; email via a transactional provider and a
Telegram bot for owner alerts; analytics events written server-side so they are not blocked by ad blockers.

## 7. Decisions the owner must make

1. Owner alert channel: Telegram bot or email (Phase 1, needed before promotion).
2. Which three segment pages run first and with what Khmer copy.
3. Legal review timing: nothing from the regulated categories goes public before it.
4. Payment provider for Phase 3 (ABA PayWay or a licensed KHQR PSP) and the exact fee presentation.
5. Whether providers may message a customer before quoting (plan says messaging is subject to consent; proposal: no).
6. Business plan prices: schema seeds Business 19 and Business Pro 49; the plan quotes 19-29 and 49-79. Pick before Phase 3.

## 8. Order of work and rough effort

| Order | Work | Effort |
|---|---|---|
| 1 | Worker deploy, owner alerts, source and loss reason, KPI strip, rate limiting | 1 week |
| 2 | Segment pages, category SEO pages, analytics events, font loading | 1 week |
| 3 | Pilot runs: 20 paid projects, copy fixes from real conversations | Feb to Mar 2027 |
| 4 | Migration 0005 and the quote-to-completion flow, profiles and portfolio | 4 weeks |
| 5 | Messaging with consent, notifications, search | 2 weeks |
| 6 | Identity checks, reports, disputes, moderation, admin KPIs | 2 weeks |
| 7 | Closed beta (April), public web launch (June) | per plan calendar |
| 8 | Saved providers, rehire, templates, business accounts, payments references, AI scope helper | 4 weeks, Q3 |
| 9 | Scheduling, analytics, category expansion | Q4 |

## 9. Locked updates

Decisions the owner has taken; build when the trigger is met.

| Update | Decision | Trigger | What it needs to start |
|---|---|---|---|
| Identity verification, level 3 (KYC provider) | Locked on 2026-10-10. Replace manual-only review with a KYC provider doing document authenticity, liveness and face match, keeping a human as the final approver and the Identity checked label unchanged. | Before public launch, or when identity checks pass about 100 a month, whichever comes first. Until then: manual review plus the level 2 checks (MRZ checksum, duplicate ID number, live-capture flag). | Owner picks the provider (candidates: Sumsub, Veriff, Onfido, iDenfy; compare Cambodian ID template support and per-check price), creates the account and gives the API key to the Cloudflare secret store. Then: migration adding provider_ref and result fields to identity_checks, a webhook route under /api/kyc, and the queue showing the provider verdict beside the photos. Track CamDigiKey for a government-backed check later. |
