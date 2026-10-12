import type { Metadata } from "next";
import Link from "next/link";
import { Button, PageTitle, Pill } from "@/components/ui";
import { MONTHS, business } from "@/lib/demo/business-fixtures";
import { pick, providerBySlug } from "@/lib/demo/fixtures";
import { getLocale, getT } from "@/lib/i18n/server";
import { Avatar, ProviderCard } from "../demo-ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Business") };
}

const STATUS: Record<string, { text: string; tone: "green" | "amber" | "neutral" }> = {
  done: { text: "Completed", tone: "green" },
  in_progress: { text: "In progress", tone: "amber" },
  quotes: { text: "Quotes received", tone: "amber" },
  open: { text: "Waiting for quotes", tone: "neutral" },
};
const ROLE: Record<string, string> = { owner: "Owner", manager: "Manager", member: "Member" };

/** Business dashboard demo: spend, projects posted by the team, the providers who did the work, and the team itself. */
export default async function DemoBusinessPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const b = business;
  const done = b.jobs.filter((j) => j.status === "done");
  const byMonth = MONTHS.map((m) => ({ ...m, total: done.filter((j) => j.month === m.key).reduce((s, j) => s + j.price, 0) }));
  const max = Math.max(...byMonth.map((m) => m.total), 1);
  const thisMonth = byMonth[byMonth.length - 1].total;
  const openCount = b.jobs.filter((j) => j.status === "open" || j.status === "quotes").length;
  const running = b.jobs.filter((j) => j.status === "in_progress").length;
  const providerSlugs = [...new Set(done.map((j) => j.provider))];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageTitle lead={`${pick(b.city, locale)} · ${pick(b.plan, locale)} · ${t("{n} members", { n: b.members.length })}`}>{pick(b.name, locale)}</PageTitle>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t("Spend this month"), `$${thisMonth}`],
          [t("Open projects"), String(openCount)],
          [t("In progress"), String(running)],
          [t("Providers worked with"), String(providerSlugs.length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-stone-200 p-4">
            <p className="text-sm text-ink-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-stone-200 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">{t("Spend by month")}</h2>
          <span className="text-sm text-ink-muted">{t("Paid directly to the provider")}</span>
        </div>
        <ol className="mt-4 flex h-40 items-end gap-3" aria-label={t("Spend by month")}>
          {byMonth.map((m) => (
            <li key={m.key} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold">{m.total ? `$${m.total}` : ""}</span>
              <div className="flex h-28 w-full items-end">
                <div className={`w-full rounded-t-lg ${m.total ? "bg-brand-500" : "bg-stone-100"}`} style={{ height: `${Math.max((m.total / max) * 100, m.total ? 6 : 2)}%` }} />
              </div>
              <span className="text-xs text-ink-muted">{pick(m.label, locale)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">{t("Projects")}</h2>
          <Link href="/demo/new-project" className="text-sm font-medium underline">{t("New project")}</Link>
        </div>
        <ul className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200">
          {[...b.jobs].reverse().map((j) => {
            const p = j.provider ? providerBySlug(j.provider) : undefined;
            const s = STATUS[j.status];
            return (
              <li key={j.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  {j.projectId ? (
                    <Link href={`/demo/projects/${j.projectId}`} className="font-semibold hover:underline">{pick(j.title, locale)}</Link>
                  ) : (
                    <p className="font-semibold">{pick(j.title, locale)}</p>
                  )}
                  <p className="text-sm text-ink-muted">
                    {t("Posted by {name}", { name: j.postedBy })}
                    {p ? ` · ${pick(p.name, locale)}` : ""}
                    {j.price ? ` · $${j.price}` : ""}
                  </p>
                </div>
                <Pill tone={s.tone}>{t(s.text)}</Pill>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{t("Providers who worked for us")}</h2>
        <ul className="mt-3 space-y-3">
          {providerSlugs.map((slug) => {
            const p = providerBySlug(slug)!;
            const jobs = done.filter((j) => j.provider === slug);
            const last = jobs[jobs.length - 1];
            return (
              <li key={slug} className="rounded-xl border border-stone-200 p-4">
                <ProviderCard
                  provider={p}
                  locale={locale}
                  t={t}
                  action={
                    <Link href={last.projectId ? `/demo/new-project?rehire=${last.projectId}&provider=${slug}` : `/demo/providers/${slug}`} className="shrink-0">
                      <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm">{t("Hire again")}</Button>
                    </Link>
                  }
                />
                <p className="mt-2 text-sm text-ink-muted">
                  {jobs.length === 1 ? t("1 job for us") : t("{n} jobs for us", { n: jobs.length })} · ${jobs.reduce((s, j) => s + j.price, 0)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">{t("Team")}</h2>
          <span className="text-sm text-ink-muted">{t("Invite by email (Business plan)")}</span>
        </div>
        <ul className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200">
          {b.members.map((m) => (
            <li key={m.email} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={pick(m.name, locale)} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{pick(m.name, locale)}</p>
                <p className="truncate text-sm text-ink-muted">{m.email}</p>
              </div>
              <Pill tone={m.role === "owner" ? "amber" : "neutral"}>{t(ROLE[m.role])}</Pill>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-muted">{t("Managers can post projects and accept quotes. Members can post; the owner or a manager accepts.")}</p>
      </section>

      <p className="mt-10 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">{t("Invoices per job and a monthly export come with payments in Phase 3.")}</p>
    </main>
  );
}
