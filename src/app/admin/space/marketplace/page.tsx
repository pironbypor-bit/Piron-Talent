import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui";
import { getMarketplace, type Funnel } from "@/lib/app/space";
import { SpaceNav } from "../space-nav";

export const metadata: Metadata = { title: "Marketplace - Piron Work Space" };
export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";

function steps(f: Funnel): { label: string; n: number }[] {
  return [
    { label: "Projects posted", n: f.projects },
    { label: "Got a quote", n: f.with_quote },
    { label: "Quote accepted", n: f.accepted },
    { label: "Work delivered", n: f.delivered },
    { label: "Confirmed", n: f.confirmed },
  ];
}

function FunnelBars({ title, f }: { title: string; f: Funnel }) {
  const rows = steps(f);
  const top = Math.max(1, rows[0].n);
  return (
    <div className={card}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {rows.map((r, i) => {
          const prev = i === 0 ? null : rows[i - 1].n;
          const pct = prev === null || prev === 0 ? null : Math.round((r.n / prev) * 100);
          return (
            <li key={r.label}>
              <div className="flex items-baseline justify-between text-sm">
                <span>{r.label}</span>
                <span className="font-semibold">{r.n}{pct !== null && <span className="ml-1 text-xs font-normal text-ink-muted">({pct}% of previous)</span>}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-stone-100">
                <div className="h-2 rounded-full bg-brand-400" style={{ width: `${Math.max(2, (r.n / top) * 100)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">Cancelled after accepting: {f.cancelled}</p>
    </div>
  );
}

/** Piron Work Space, step 3: is the marketplace actually working? Counts only; no private text. */
export default async function MarketplacePage() {
  const m = await getMarketplace();
  if (!m) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">Not allowed.</Notice>
      </main>
    );
  }
  const a = m.funnel_all;
  const cancelRate = a.accepted > 0 ? `${Math.round((a.cancelled / a.accepted) * 100)}%` : "none yet";
  const numbers: [string, string, string][] = [
    ["Time to first quote", m.hours_to_first_quote === null ? "No quotes yet" : `${m.hours_to_first_quote} h`, "middle value, all projects"],
    ["Average stars", m.avg_stars === null ? "No reviews yet" : `${m.avg_stars}`, `${m.reviews} review${m.reviews === 1 ? "" : "s"}`],
    ["Cancel rate", cancelRate, "of accepted jobs"],
    ["Quotes waiting 2+ days", String(m.quotes_waiting_2d), "customer has not answered"],
    ["Projects with no quote 3+ days", String(m.no_quote_3d), "may need a push"],
  ];
  const busiest = [...m.categories].sort((x, y) => y.posts - x.posts || y.providers - x.providers).slice(0, 6);
  const needProviders = [...m.categories].filter((c) => c.providers === 0 || c.posts > c.providers).sort((x, y) => y.posts - x.posts || x.providers - y.providers).slice(0, 6);
  const noPosts = m.categories.filter((c) => c.posts === 0 && c.providers > 0).slice(0, 6);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <SpaceNav active="marketplace" />
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-2">
            <FunnelBars title="Last 30 days" f={m.funnel_30d} />
            <FunnelBars title="All time" f={m.funnel_all} />
          </section>

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {numbers.map(([k, v, note]) => (
              <div key={k} className={card}>
                <p className="text-xs text-ink-muted">{k}</p>
                <p className="text-2xl font-bold">{v}</p>
                <p className="text-xs text-ink-muted">{note}</p>
              </div>
            ))}
          </section>

          {m.bookings && (
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {([["Booking requests, 30 days", m.bookings.requests_30d], ["Agreed", m.bookings.agreed_30d], ["Declined", m.bookings.declined_30d], ["Expired unanswered", m.bookings.expired_30d], ["Waiting now", m.bookings.waiting_now]] as [string, number][]).map(([k, v]) => (
                <div key={k} className={card}><p className="text-xs text-ink-muted">{k}</p><p className="text-2xl font-bold">{v}</p></div>
              ))}
            </section>
          )}

          <section className={card}>
            <h2 className="text-sm font-semibold">Jobs that look stuck</h2>
            <p className="text-xs text-ink-muted">Accepted for more than 7 days without delivery, or delivered for more than 3 days without confirmation.</p>
            {m.stuck.length === 0 ? (
              <p className="mt-3 text-sm text-green-800">Nothing is stuck.</p>
            ) : (
              <ul className="mt-2 divide-y divide-stone-100 text-sm">
                {m.stuck.map((s) => (
                  <li key={s.id}>
                    <Link href={`/app/post/${s.post_id}`} className="flex items-center gap-3 py-2 hover:bg-brand-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{s.title}</span>
                        <span className="block text-xs text-ink-muted">{s.customer ?? "?"} to {s.provider ?? "?"}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{s.status} · {s.days} days</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="text-sm font-semibold">Busiest categories</h2>
              <p className="text-xs text-ink-muted">Projects posted in the last 90 days, and providers in that category.</p>
              <ul className="mt-2 space-y-1 text-sm">
                {busiest.map((c) => (
                  <li key={c.name} className="flex items-center justify-between border-b border-stone-100 pb-1">
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 text-xs text-ink-muted"><b className="text-ink">{c.posts}</b> projects · <b className="text-ink">{c.providers}</b> providers</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={card}>
              <h2 className="text-sm font-semibold">Needs more providers</h2>
              <p className="text-xs text-ink-muted">Customers ask here and few or no providers answer.</p>
              {needProviders.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">No gap right now.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {needProviders.map((c) => (
                    <li key={c.name} className="flex items-center justify-between border-b border-stone-100 pb-1">
                      <span className="truncate">{c.name}</span>
                      <span className="shrink-0 text-xs text-ink-muted"><b className="text-ink">{c.posts}</b> projects · <b className="text-ink">{c.providers}</b> providers</span>
                    </li>
                  ))}
                </ul>
              )}
              {noPosts.length > 0 && <p className="mt-3 text-xs text-ink-muted">Providers but no projects yet: {noPosts.map((c) => c.name).join(", ")}.</p>}
            </div>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold">Cities</h2>
            <p className="text-xs text-ink-muted">&ldquo;Not set&rdquo; means the person or project has no city saved.</p>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted"><th className="py-1 font-medium">City</th><th className="py-1 text-right font-medium">Projects, 90 days</th><th className="py-1 text-right font-medium">Providers</th></tr>
              </thead>
              <tbody>
                {m.cities.map((c) => (
                  <tr key={c.city} className="border-t border-stone-100"><td className="py-1.5">{c.city}</td><td className="py-1.5 text-right font-semibold">{c.posts}</td><td className="py-1.5 text-right font-semibold">{c.providers}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </main>
  );
}
