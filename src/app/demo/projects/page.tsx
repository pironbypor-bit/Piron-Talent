import type { Metadata } from "next";
import Link from "next/link";
import { Button, PageTitle, Pill } from "@/components/ui";
import { pick, projects } from "@/lib/demo/fixtures";
import { getLocale, getT } from "@/lib/i18n/server";
import { demoDate } from "../demo-ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Projects") };
}

export default async function DemoProjectsPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle lead={t("Try the whole flow: post, compare quotes, accept, deliver, confirm, review.")}>{t("Projects")}</PageTitle>
        <Link href="/demo/new-project">
          <Button type="button">{t("New project")}</Button>
        </Link>
      </div>
      <ul className="space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="rounded-xl border border-stone-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link href={`/demo/projects/${p.id}`} className="text-lg font-semibold hover:underline">
                  {pick(p.title, locale)}
                </Link>
                <p className="mt-1 text-sm text-ink-muted">
                  {pick(p.customer.name, locale)} · {pick(p.categoryName, locale)} · {t("Posted on {date}", { date: demoDate(p.postedOn, locale) })}
                </p>
                <p className="mt-2 line-clamp-2 text-sm">{pick(p.details, locale)}</p>
                <p className="mt-2 text-sm">
                  {t("Budget")} ${p.budgetMin} - ${p.budgetMax} · {t("Deadline")} {pick(p.deadline, locale)} · {p.remote ? t("Remote") : t("On site")}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <Pill tone={p.outcome ? "green" : "amber"}>{p.outcome ? t("Completed") : t("Open@@status")}</Pill>
                <p className="mt-2 text-sm text-ink-muted">{t("{n} quotes", { n: p.quotes.length })}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
