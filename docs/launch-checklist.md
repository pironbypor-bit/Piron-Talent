# Public launch checklist, Cloudflare + Supabase

Owner steps are marked **(owner)**: they need the domain, a dashboard login or a decision. Everything else is done in code.

## 1. Domain and Worker (done 2026-10-14: piron.tech bought at Hostinger, zone in Cloudflare, app.piron.tech on the Worker, piron.tech on Hostinger WordPress)

1. Pick the domain (for example `pirontalent.com`) and add it to the Cloudflare account that holds the `piron-talent` Worker (poleangpor1@gmail.com).
2. Workers & Pages → piron-talent → Settings → Domains & Routes → **Add custom domain**: the apex and `www`. Cloudflare issues the certificate.
3. Settings → Variables and Secrets → add `NEXT_PUBLIC_SITE_URL = https://<domain>`. Run `npm run deploy`. The sitemap, robots and share links then use the real domain.
4. Keep the `*.workers.dev` address for one month as a fallback, then disable it under Domains & Routes.

## 2. Supabase auth URLs (done 2026-10-14)

Authentication → URL Configuration:

- Site URL: `https://<domain>`
- Redirect URLs: add `https://<domain>/**` and `https://www.<domain>/**`. Keep the Worker address until it is disabled.

The bilingual email templates need no change.

## 3. Email sender (owner)

- Brevo → Senders & Domains → add the domain, then add the SPF, DKIM and DMARC records Brevo shows into Cloudflare DNS. Mail from a Gmail sender lands in spam more often.
- Change the sender to `hello@<domain>` in two places: Supabase → Authentication → SMTP Settings, and the `sender` line of `email_notification()` (migration 0010). Re-run that one `create or replace function`.
- Paste the Brevo API key into Vault once:
  `select vault.update_secret((select id from vault.secrets where name='brevo_api_key'), '<key>');`

## 4. Cloudflare protection (owner, 15 minutes)

Security → WAF → Rate limiting rules, on the custom domain:

| Rule | Expression | Limit |
|---|---|---|
| Intake forms | `http.request.method eq "POST" and http.request.uri.path in {"/post-project" "/join"}` | 5 per 10 minutes per IP, block 1 hour |
| Auth | `http.request.method eq "POST" and http.request.uri.path in {"/login" "/signup" "/forgot-password"}` | 10 per 10 minutes per IP |
| App writes | `http.request.method eq "POST" and starts_with(http.request.uri.path, "/app/")` | 60 per minute per IP |

Also: Security → Bots → **Bot Fight Mode** on. Security → Settings → Security level **Medium**.

## 5. Analytics and monitoring (owner)

- Analytics → Web Analytics → add site → copy the token → Workers & Pages → piron-talent → Variables → `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`. The layout adds the beacon when the token exists.
- Supabase free plan limits: 500 MB database, 1 GB storage, 50k monthly active users, no daily backups. Move to Pro before promotion so backups run daily; then enable point-in-time recovery under Database → Backups.
- Cloudflare → Workers → piron-talent → Logs: check for 5xx after the first day of traffic.

## 6. Legal (owner decision, pages exist)

- `/privacy` and `/terms` are live with plain bilingual text that matches how the app works today. Have a Cambodian lawyer read both before the first paid promotion. Text lives in `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` and the Khmer dictionary.
- Registered business name and address go into the footer once decided (`src/components/site-header.tsx`).

## 7. Done in code

- Security headers on every response: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `Strict-Transport-Security`.
- `robots.txt` blocks `/app`, `/admin` and auth pages; `sitemap.xml` lists public pages and available providers.
- Privacy and Terms pages, linked from the footer and the sign-up form.
- Cloudflare Web Analytics beacon, enabled by the token variable.
- Secrets live in Cloudflare variables, Supabase Vault or `.env.local`; nothing in git.

## 8. Day of launch

1. Decide whether the "Pilot programme, 2027" line stays on the home page (`src/app/page.tsx`).
2. Use the segment pages as the ad landing pages: `/for/online-sellers`, `/for/cafes`, `/for/students`. Each form tags its source.
3. Watch `/admin` for requests and `/admin/reports` daily for the first two weeks.
