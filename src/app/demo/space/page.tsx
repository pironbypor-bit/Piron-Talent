import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BarChart3, Bug, FileText, Flag, LayoutDashboard, ScrollText, Users, Wallet } from "lucide-react";

export const metadata: Metadata = { title: "Piron Work Space demo" };

// Demo of Piron Work Space, step 1 (Overview). All numbers are examples. Nothing here reads real data.

const NAV = [
  { label: "Overview", Icon: LayoutDashboard, step: 1 },
  { label: "People", Icon: Users, step: 2 },
  { label: "Marketplace", Icon: BarChart3, step: 3 },
  { label: "Errors", Icon: Bug, step: 4 },
  { label: "Features", Icon: Flag, step: 5 },
  { label: "Money", Icon: Wallet, step: 6 },
  { label: "Reports", Icon: FileText, step: 7 },
  { label: "Audit log", Icon: ScrollText, step: 7 },
];

const NEEDS = [
  { label: "Identity checks", n: 2, href: "/admin/identity" },
  { label: "Reports", n: 1, href: "/admin/reports" },
  { label: "Payout accounts", n: 1, href: "/admin/payout-accounts" },
  { label: "Project requests", n: 1, href: "/admin" },
  { label: "Disputes", n: 0, href: "/admin/disputes" },
];

const TODAY = [
  { label: "New users", n: 4, d: "+2 vs yesterday" },
  { label: "New posts", n: 3, d: "same as yesterday" },
  { label: "Quotes sent", n: 5, d: "+1 vs yesterday" },
  { label: "Jobs accepted", n: 2, d: "-1 vs yesterday" },
  { label: "Jobs confirmed", n: 1, d: "same as yesterday" },
  { label: "Active people", n: 18, d: "+4 vs yesterday" },
];

const TOTALS = [
  ["Users", "126"],
  ["Providers", "31"],
  ["Identity checked", "22"],
  ["Companies", "9"],
  ["Open posts", "14"],
  ["Confirmed jobs", "37"],
];

const STATUS = [
  { name: "App", note: "Responding in 120 ms", ok: true },
  { name: "Database", note: "Responding in 18 ms", ok: true },
  { name: "Email (Brevo)", note: "Last email sent 4 minutes ago", ok: true },
  { name: "Push messages", note: "Last push sent 4 minutes ago", ok: true },
  { name: "Scheduled reminders", note: "Last run 7 minutes ago, sent 3", ok: true },
  { name: "File storage", note: "Responding", ok: true },
];

const GROWTH = [2, 3, 1, 4, 6, 3, 2, 5, 4, 7, 3, 2, 6, 4];

const RECENT = [
  ["10:42", "You approved a payout account"],
  ["10:15", "You turned on the identity check for one person"],
  ["Yesterday", "You closed a report as handled"],
  ["Yesterday", "You approved a provider application"],
];

const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";

export default function SpaceDemo() {
  const max = Math.max(...GROWTH);
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
        <span className="text-sm text-ink-muted">Thursday 15 October 2026 · Phnom Penh time</span>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <nav aria-label="Space sections" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map(({ label, Icon, step }) => {
            const on = step === 1;
            return (
              <span key={label} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${on ? "bg-brand-100 text-brand-900" : "text-ink-muted"}`}>
                <Icon className="size-4" />
                {label}
                {!on && <span className="ml-auto rounded-full bg-stone-100 px-1.5 text-[10px] font-semibold text-ink-muted">Step {step}</span>}
              </span>
            );
          })}
        </nav>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <div className="text-sm">
              <p className="font-semibold">1 error repeated 6 times in the last hour</p>
              <p className="text-ink-muted">&ldquo;Could not save the profile photo&rdquo; on the Edit profile page. Opens in the Errors section (step 4).</p>
            </div>
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-800">Needs you now</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {NEEDS.map((x) => (
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
              {TODAY.map((x) => (
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
                {GROWTH.map((n, i) => (
                  <span key={i} className="flex-1 rounded-t bg-brand-400" style={{ height: `${(n / max) * 100}%` }} />
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted">52 new people in 14 days. The full chart is in People (step 2).</p>
            </div>
            <div className={card}>
              <h2 className="text-sm font-semibold">Totals</h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {TOTALS.map(([k, v]) => (
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
              {STATUS.map((s) => (
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
            <h2 className="text-sm font-semibold">Your recent actions</h2>
            <ul className="mt-2 divide-y divide-stone-100 text-sm">
              {RECENT.map(([when, what]) => (
                <li key={what} className="flex gap-3 py-2">
                  <span className="w-20 shrink-0 text-xs text-ink-muted">{when}</span>
                  <span>{what}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-ink-muted">Every action you take in the Space is written to the audit log (step 7 shows the whole list).</p>
          </section>
        </div>
      </div>
    </main>
  );
}
