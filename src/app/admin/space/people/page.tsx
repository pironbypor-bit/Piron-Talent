import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Notice } from "@/components/ui";
import { Dropdown } from "@/components/dropdown";
import { PEOPLE_FILTERS, agoText, getPeople, getPeopleSummary, type PeopleFilter } from "@/lib/app/space";
import { SpaceNav } from "../space-nav";

export const metadata: Metadata = { title: "People - Piron Work Space" };
export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";
const FILTER_LABEL: Record<PeopleFilter, string> = { all: "Everyone", providers: "Providers", checked: "Identity checked", new: "New this week", paused: "Paused" };

/** Piron Work Space, step 2: how many people, who they are, find one. No email, phone or ID number is shown here. */
export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const { q = "", filter = "all" } = await searchParams;
  const word = q.replace(/[^\p{L}\p{N}\p{M} ]+/gu, " ").replace(/ +/g, " ").trim().slice(0, 60);
  const active = (PEOPLE_FILTERS as readonly string[]).includes(filter) ? (filter as PeopleFilter) : "all";
  const [summary, people] = await Promise.all([getPeopleSummary(), getPeople(word, active)]);
  if (!summary || !people) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">Not allowed.</Notice>
      </main>
    );
  }
  const max = Math.max(1, ...summary.growth.map((g) => g.n));
  const total30 = summary.growth.reduce((n, g) => n + g.n, 0);
  const stats: [string, number][] = [
    ["People", summary.total], ["New this week", summary.new_7d], ["New this month", summary.new_30d],
    ["Providers", summary.providers], ["Identity checked", summary.identity_checked], ["Signed in, 7 days", summary.active_7d],
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <SpaceNav active="people" />
        <div className="space-y-4">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stats.map(([k, v]) => (
              <div key={k} className={card}>
                <p className="text-xs text-ink-muted">{k}</p>
                <p className="text-2xl font-bold">{v}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="text-sm font-semibold">New people, last 30 days</h2>
              <div className="mt-3 flex h-24 items-end gap-0.5" aria-hidden="true">
                {summary.growth.map((g) => (
                  <span key={g.day} title={`${g.day}: ${g.n}`} className="flex-1 rounded-t bg-brand-400" style={{ height: `${Math.max(4, (g.n / max) * 100)}%` }} />
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-muted">{total30} new in 30 days. {summary.paused > 0 ? `${summary.paused} paused.` : ""}</p>
            </div>
            <div className={card}>
              <h2 className="text-sm font-semibold">Where they are</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {summary.cities.map((c) => (
                  <li key={c.city} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 truncate text-ink-muted">{c.city}</span>
                    <span className="h-2 rounded-full bg-brand-400" style={{ width: `${Math.max(4, (c.n / summary.total) * 100)}%` }} />
                    <span className="font-semibold">{c.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={card}>
            <form method="get" action="/admin/space/people" className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search people</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <input name="q" defaultValue={word} maxLength={60} placeholder="Search name, role, city" className="w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500" />
              </label>
              <Dropdown compact submitOnChange name="filter" defaultValue={active} label="Show" className="w-44" options={PEOPLE_FILTERS.map((f) => ({ value: f, label: FILTER_LABEL[f] }))} />
            </form>

            <ul className="mt-3 divide-y divide-stone-100">
              {people.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/space/people/${p.id}`} className="flex items-center gap-3 py-2.5 hover:bg-brand-50">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-200 text-sm font-bold text-brand-900">{p.display_name.charAt(0).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-medium">{p.display_name}</span>
                        {p.identity_checked && <span className="rounded-full bg-green-100 px-1.5 text-[10px] font-semibold text-green-900">Checked</span>}
                        {p.is_available && <span className="rounded-full bg-brand-100 px-1.5 text-[10px] font-semibold text-brand-900">Provider</span>}
                        {p.paused_at && <span className="rounded-full bg-red-100 px-1.5 text-[10px] font-semibold text-red-900">Paused</span>}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">{[p.role_line, p.city].filter(Boolean).join(" · ") || "No details yet"}</span>
                    </span>
                    <span className="hidden text-right text-xs text-ink-muted sm:block">
                      <span className="block">{p.posts} posts · {p.jobs} jobs</span>
                      <span className="block">Last seen {agoText(p.last_sign_in_at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {people.length === 0 && <li className="py-6 text-center text-sm text-ink-muted">Nobody matches.</li>}
            </ul>
            <p className="mt-2 text-xs text-ink-muted">Showing up to 60, newest first.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
