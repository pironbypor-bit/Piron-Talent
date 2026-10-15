import type { Metadata } from "next";
import Link from "next/link";
import { Notice, PageTitle } from "@/components/ui";
import { adminKpis } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { requireAdmin } from "../guard";

export const metadata: Metadata = { title: "Admin" };

const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0);

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-ink-muted">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Owner numbers: people, the project funnel, speed, where requests come from, the community, and eight weeks of trend. */
export default async function AdminKpisPage() {
  const [t, locale, { isAdmin }] = await Promise.all([getT(), getLocale(), requireAdmin()]);
  const k = isAdmin ? await adminKpis() : null;
  if (!isAdmin || !k) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">{t("Not allowed.")}</Notice>
      </main>
    );
  }
  const m = k.market;
  const funnel: [string, number][] = [
    [t("Projects posted"), m.projects],
    [t("Got a quote"), m.projects_with_quote],
    [t("Quote accepted"), m.accepted],
    [t("Work delivered"), m.delivered],
    [t("Confirmed"), m.confirmed],
    [t("Reviewed"), m.reviews],
  ];
  const peak = Math.max(1, ...k.weekly.flatMap((w) => [w.signups, w.projects, w.quotes, w.confirmed]));

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="mb-6"><Link href="/admin" className="text-sm font-medium underline">{t("Back")}</Link></p>
      <PageTitle lead={t("Counts from the live database. Nothing here is estimated.")}>{t("Numbers")}</PageTitle>

      <section className="mt-6">
        <h2 className="text-xl font-bold">{t("People")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label={t("Accounts")} value={k.people.total} />
          <Stat label={t("New in 7 days")} value={k.people.new_7d} />
          <Stat label={t("New in 30 days")} value={k.people.new_30d} />
          <Stat label={t("Providers listed")} value={k.people.providers} />
          <Stat label={t("Identity checked")} value={k.people.identity_checked} />
          <Stat label={t("With a completed job")} value={k.people.with_record} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{t("Project funnel")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("Share of all posted projects that reached each step.")}</p>
        <ul className="mt-3 space-y-2">
          {funnel.map(([label, n]) => (
            <li key={label}>
              <div className="flex items-baseline justify-between text-sm"><span>{label}</span><span className="font-semibold">{n}{m.projects > 0 && ` · ${pct(n, m.projects)}%`}</span></div>
              <div className="mt-1 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, pct(n, m.projects))}%` }} /></div>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("Projects in 30 days")} value={m.projects_30d} />
          <Stat label={t("Quotes in 30 days")} value={m.quotes_30d} />
          <Stat label={t("Median time to first quote")} value={m.hours_to_first_quote === null ? "-" : `${m.hours_to_first_quote} h`} />
          <Stat label={t("Average review")} value={m.avg_stars === null ? "-" : Number(m.avg_stars).toFixed(1)} hint={t("{n} reviews", { n: m.reviews })} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{t("Requests to the team")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("Requests in total")} value={k.intake.requests} />
          <Stat label={t("Requests in 30 days")} value={k.intake.requests_30d} />
          <Stat label={t("Provider applications")} value={k.intake.applications} />
        </div>
        {k.intake.by_source.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-ink-muted">{t("Where requests came from, last 90 days")}</h3>
            <ul className="mt-2 divide-y divide-stone-200 rounded-2xl border border-stone-200">
              {k.intake.by_source.map((s) => (
                <li key={s.source} className="flex justify-between px-4 py-2 text-sm"><span>{s.source}</span><span className="font-semibold">{s.n}</span></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{t("Community")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label={t("Companies")} value={k.community.companies} />
          <Stat label={t("Public company pages")} value={k.community.public_pages} />
          <Stat label={t("Open jobs")} value={k.community.open_jobs} />
          <Stat label={t("Open activities")} value={k.community.open_activities} />
          <Stat label={t("Activity sign-ups")} value={k.community.activity_joins} />
          <Stat label={t("Messages in 7 days")} value={k.community.messages_7d} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{t("Last 8 weeks")}</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-ink-muted">
              <tr>
                <th className="px-4 py-2 font-medium">{t("Week starting")}</th>
                <th className="px-4 py-2 font-medium">{t("New accounts")}</th>
                <th className="px-4 py-2 font-medium">{t("Projects")}</th>
                <th className="px-4 py-2 font-medium">{t("Quotes")}</th>
                <th className="px-4 py-2 font-medium">{t("Confirmed")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {[...k.weekly].reverse().map((w) => (
                <tr key={w.week}>
                  <td className="px-4 py-2 font-medium">{formatDate(w.week, locale)}</td>
                  {([w.signups, w.projects, w.quotes, w.confirmed] as number[]).map((n, i) => (
                    <td key={i} className="px-4 py-2">
                      <span className="inline-block w-6 font-semibold">{n}</span>
                      <span className="ml-2 inline-block h-2 rounded-full bg-brand-500 align-middle" style={{ width: `${Math.round((n / peak) * 64)}px` }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
