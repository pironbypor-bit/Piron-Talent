# Piron Talent app UI plan, from the four-screen mockup

Source: the owner's mockup (Home, Services, Jobs & Shifts, Profile, bottom navigation) received 2026-10-10, the business plan,
and docs/product-plan.md. This plan turns the mockup into screens we can build on the current stack: Next.js on Cloudflare,
Supabase, the brand tokens and Khmer-first copy already in the repo. No native app (plan section 5): this is the mobile web
app, installable as a PWA, with the same pages widening to desktop.

## 1. What the mockup gets right, and we keep

- Five-tab bottom navigation: Home, Services, Jobs, Messages, Profile.
- Pill filters at the top of every list; cards with a person, a title, two lines of text, place, price, and one primary action.
- Warm yellow accents, white cards, dark text, generous spacing, one accent colour for the primary button.
- Light reactions on posts (Cheer, Discuss, Keep, Connect), a verified label with a green tick, counts on the profile.
- The Business Model block: fees shown plainly to the person who pays them.

## 2. Where the mockup must bend to the business plan

| Mockup | Change | Why |
|---|---|---|
| "Need Help", "Offer Skill" tabs, Home feed | Names are Job offer, Skill offer, Share knowledge; the feed is the Workspace | Owner's naming decision of 2026-10-10 |
| "Hire Shift" tab and the whole Jobs & Shifts screen | Built behind a flag, hidden until the labour-law review clears shift placement | Plan sections 5 and 10: no directed shift placement before clearance |
| "Verified" green tick | "Identity checked" after a manual ID review; competence shows as completed-jobs count and reviews; "licensed" never appears | Plan: identity, competence and licence are three different things |
| Photos of people on every card | Real uploaded avatars and portfolio images only; a letter avatar until then | No stock faces, no fabricated providers |
| 10% service fee, 8% shift fee, $29/month on the profile | Placeholders. The plan says 6-10% effective take rate on completed paid work, plans at $19-29 and $49-79. Show fees only once decided, and only to the side that pays | Plan section 4; owner decision 6 in product-plan.md |
| "Book" with an hourly price on Services | Phase 4 (services, availability, bookings). In Phase 2, Services shows providers and "Request a quote" | Quotes before bookings in the roadmap |
| "I'm Interested" / "Apply" on jobs | Keep "Apply" (job_applications). "I'm Interested" is a soft apply we do not need | One clear action per card |
| Search "jobs, services, people" on Home | Search lives on Services and Jobs; Home search covers Workspace posts only | Keeps Home a board, not a marketplace clone |
| Recent Activity on Profile | Becomes Notifications (table exists), shown on Profile and as a bell | Same thing, one source |

## 3. Navigation and shell

| Tab | Route | Who sees it | Phase |
|---|---|---|---|
| Home | /workspace | everyone; posting needs an account | 2 |
| Services | /providers (directory) and /providers/[username] | everyone | 2 |
| Jobs | /jobs | everyone; hidden until clearance | 2 build, release after legal |
| Messages | /messages | signed in | 2 |
| Profile | /me (customer and provider views in one place) | signed in | 2 |

Shell: top bar with the brand, a bell (notifications) and the avatar; bottom bar with five icons and labels, 56px high,
safe-area padding; the current tab in brand-600 with a filled icon. Desktop: the bottom bar becomes a left rail.
Language switch moves into Profile and the first-run screen.

## 4. Screens

### 4.1 Home (Workspace)

- Search box for posts, filter pills: All, Job offer, Skill offer, Share knowledge (Hire shift appears after clearance).
- Post card: avatar, name, type pill, time, title, two lines of body, place, price or budget line, then Cheer with count,
  Discuss with count (comments), Keep, Connect.
- Connect sends an introduction the other side accepts; Discuss opens comments; Keep saves (saved_posts).
- Floating "Write a post" button bottom right, above the tab bar. Post form: type, title, text, category, place, budget.
- Newest first, Phnom Penh only, "Load more" instead of endless scroll.
- Data: posts, post_comments, post_reactions, saved_posts (schema 0001).

### 4.2 Services (providers)

- Heading and one-line promise, search, 2x4 category grid with icons (Finance, Documents, Legal, IT, Technical, Beauty,
  Creative, More) built from the categories table; regulated categories greyed with "after review".
- "Popular providers" list: avatar, name, role line, rating and count, "Identity checked" pill, price-from line, Keep heart,
  primary action "Request a quote" (Phase 2) or "Book" (Phase 4).
- Provider page: as the demo profile, plus services with fixed prices in Phase 4.
- Data: profiles, profile_skills, portfolio_items, reviews, services (Phase 4).

### 4.3 Jobs (and shifts, later)

- Filter pills: All, Part-time, Short-term, Freelance (shift types after clearance).
- Job card: company logo or letter, title, company, place, type pill, pay line, dates, Keep, "Apply".
- Job page: description, worker count, pay, dates, remote flag, employer's completed-jobs count, Apply with a cover note.
- Employer view: applications list with Shortlist, Accept, Reject through server functions.
- Data: jobs, job_applications (schema 0001). Flag: jobs.kind shift vs freelance; shift hidden until clearance.

### 4.4 Messages

- Thread list: avatar, name, project or job title, last line, time, unread dot. Thread: bubbles, date separators, composer.
- A thread exists only after a quote, an application, or an accepted Connect.
- Data: conversations, conversation_members, messages.

### 4.5 Profile

- Greeting, one-line role ("Customer", "Provider", or both), avatar, settings gear.
- Tabs: Overview, Saved, Bookings (Phase 4: Jobs for now), Applications.
- Four counters: Saved posts, Quote requests (or Booking requests later), My applications, Active jobs.
- Identity check status with a button to start it.
- Fees block only for people who pay: providers see the effective fee on completed paid work; businesses see their plan.
- Notifications list (replaces Recent Activity), language switch, log out.
- Data: profiles, profile_private, identity_checks (new), notifications, business_subscriptions.

## 5. Components to add (on top of ui.tsx)

TabBar, TopBar, SearchBox, FilterPills, PostCard, ProviderCard (exists in demo), JobCard, CategoryTile with icon,
StatTile, ReactionButton, Heart (Keep), Thread and MessageBubble, NotificationRow, FloatingButton, BottomSheet for the
post form on phones. Icons from lucide-react (already installed).

Tokens from the mockup: card radius 16px, pill radius 999px, surface white on a brand-50 page tint for Home, shadow
0 1px 2px at 6%, primary button brand-500 with ink text, secondary white with stone-300 border, verified pill green-100.

## 6. Build order and effort (after the pilot gate)

| Step | Work | Effort |
|---|---|---|
| 1 | Shell: tab bar, top bar, Profile skeleton with counters and notifications; migration 0004 notifications outbox | 1 week |
| 2 | Workspace: post list, post form, Cheer, Keep, comments, Connect with consent; moderation hooks | 2 weeks |
| 3 | Services: category grid, provider directory with filters, provider page, Request a quote | 1.5 weeks |
| 4 | Quotes to completion flow from product-plan.md (migration 0005) wired into Profile counters | 3 weeks |
| 5 | Messages | 1.5 weeks |
| 6 | Identity checks (migration 0006), "Identity checked" pill everywhere | 1 week |
| 7 | Jobs: list, job page, Apply, employer applications; released behind the legal flag | 2 weeks |
| 8 | Phase 4: services with prices, availability, Book, booking requests on Profile | 3 weeks |

Each step ships behind the existing /demo first as fixtures when the design needs review, then on real tables.

## 7. Decisions needed from the owner

1. Fee numbers and who sees them (section 2, row 5).
2. Whether Home shows Skill offers to customers by default or only Job offers and knowledge posts.
3. Icon set for the category grid (lucide names), or custom illustrations later.
4. Whether to start the identity check before Phase 2 so the first providers carry the pill on day one.
