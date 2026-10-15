import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Notice } from "@/components/ui";
import { agoText, getSpaceOverview } from "@/lib/app/space";
import { todayPP } from "@/lib/datetime";
import { SpaceNav } from "./space-nav";

export const metadata: Metadata = { title: "Piron Work Space" };
export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";

function delta(now: number, before: number): string {
  if (now === before) return "same as yesterday";
  const d = now - before;
  return `${d > 0 ? "+" : ""}${d} vs yesterday`;
}

/** Piron Work Space, step 1: the owner Overview. Only the owner gets numbers; everyone else sees "Not allowed". */
export default async function SpaceOverviewPage() {
  const { data, status, errors } = await getSpaceOverview();
  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">Not allowed.</Notice>
      </main>
    );
  }
  const needs = [
    { label: "Identity checks", n: data.needs.identity, href: "/admin/identity" },
    { label: "Reports", n: data.needs.reports, href: "/admin/reports" },
    { label: "Payout accounts", n: data.needs.payouts, href: "/admin/payout-accounts" },
    { label: "Project requests", n: data.needs.requests + data.needs.applications, href: "/admin" },
    { label: "Disputes", n: data.needs.disputes, href: "/admin/disputes" },
    { label: "Open errors", n: errors.open, href: "/admin/space/errors" },
  ];
  const t = data.today;
  const today = [
    { label: "New users", n: t.users[0], d: delta(t.users[0], t.users[1]) },
    { label: "New posts", n: t.posts[0], d: delta(t.posts[0], t.posts[1]) },
    { label: "Quotes sent", n: t.quotes[0], d: delta(t.quotes[0], t.quotes[1]) },
    { label: "Jobs accepted", n: t.accepted[0], d: delta(t.accepted[0], t.accepted[1]) },
    { label: "Jobs confirmed", n: t.confirmed[0], d: delta(t.confirmed[0], t.confirmed[1]) },
    { label: "People signed in", n: t.active, d: "today" },
  ];
  const tt = data.totals;
  const totals: [string, number][] = [
    ["Users", tt.users], ["Providers", tt.providers], ["Identity checked", tt.identity_checked],
    ["Companies", tt.companies], ["Open posts", tt.open_posts], ["Confirmed jobs", tt.confirmed_jobs],
  ];
  const max = Math.max(1, ...data.growth.map((g) => g.n));
  const total14 = data.growth.reduce((n, g) => n + g.n, 0);
  const bad = status.filter((s) => !s.ok);
  const day = new Date(`${todayPP()}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
        <span className="text-sm text-ink-muted">{day} · Phnom Penh time</span>
      </header>
      <p className="mt-1 flex gap-4 text-sm"><Link href="/app" className="underline">Open Piron Work</Link><Link href="/admin" className="underline">Requests and applicants</Link></p>

      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <SpaceNav active="overview" />
        <div className="space-y-4">
          {bad.length > 0 || data.send_failed_24h > 0 || errors.repeating > 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div className="text-sm">
                <p className="font-semibold">{errors.repeating > 0 ? `${errors.repeating} app error${errors.repeating === 1 ? "" : "s"} repeating right now` : bad.length > 0 ? `${bad.map((s) => s.name).join(", ")} ${bad.length === 1 ? "needs" : "need"} a look` : "Some messages failed to send"}</p>
                <p className="text-ink-muted">
                  {data.send_failed_24h > 0 ? `${data.send_failed_24h} email or push calls failed in the last 24 hours. ` : ""}
                  See System status below and the <Link href="/admin/space/errors" className="underline">Errors</Link> section.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900">
              <CheckCircle2 className="size-5 shrink-0 text-green-600" />
              <p className="text-sm font-semibold">Everything is working</p>
            </div>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-800">Needs you now</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {needs.map((x) => (
                <Link key={x.label} href={x.href} className={`${card} text-center hover:bg-brand-50 ${x.n === 0 ? "opacity-60" : ""}`}>
                  <span className={`block text-2xl font-bold ${x.n > 0 ? "text-brand-800" : ""}`}>{x.n}</span>
                  <span className="block text-xs text-ink-muted">{x.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-800">Today</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {today.map((x) => (
                <div key={x.label} className={card}>
                  <p className="text-xs text-ink-muted">{x.label}</p>
                  <p className="text-2xl font-bold">{x.n}</p>
                  <p className="text-xs text-ink-muted">{x.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="text-sm font-semibold">New users, last 14 days</h2>
              <div className="mt-3 flex h-24 items-end gap-1" aria-hidden="true">
                {data.growth.map((g) => (
                  <span key={g.day} title={`${g.day}: ${g.n}`} className="flex-1 rounded-t bg-brand-400" style={{ height: `${Math.max(4, (g.n / max) * 100)}%` }} />
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted">{total14} new {total14 === 1 ? "person" : "people"} in 14 days.</p>
            </div>
            <div className={card}>
              <h2 className="text-sm font-semibold">Totals</h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {totals.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between border-b border-stone-100 pb-1">
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold">System status</h2>
            <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {status.map((s) => (
                <li key={s.name} className="flex items-start gap-2 py-1 text-sm">
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${s.ok ? "bg-green-500" : "bg-red-500"}`} />
                  <span>
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-xs text-ink-muted">{s.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold">Recent admin actions</h2>
            {data.recent.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">Nothing recorded yet. Every admin action from now on is written here.</p>
            ) : (
              <ul className="mt-2 divide-y divide-stone-100 text-sm">
                {data.recent.map((r, i) => (
                  <li key={i} className="flex gap-3 py-2">
                    <span className="w-28 shrink-0 text-xs text-ink-muted">{agoText(r.at)}</span>
                    <span>{r.action}{r.target ? ` · ${r.target}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
