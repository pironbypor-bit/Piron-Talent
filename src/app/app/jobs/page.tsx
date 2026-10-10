import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState, Pill } from "@/components/ui";
import { listJobs } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Jobs & Shifts") };
}

export const JOB_TYPE_LABEL: Record<string, string> = { part_time: "Part-time", short_term: "Short-term", freelance: "Freelance", project: "Project based" };
export const PAY_UNIT_LABEL: Record<string, string> = { hour: "per hour", day: "per day", shift: "per day", project: "per project" };

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const [t, locale, jobs, { type }] = await Promise.all([getT(), getLocale(), listJobs(), searchParams]);
  const active = type === "freelance" || type === "project" ? type : "all";
  const list = jobs.filter((j) => active === "all" || j.job_type === active);

  return (
    <main className="px-4 py-4">
      <h1 className="text-xl font-bold">{t("Jobs & Shifts")}</h1>
      <p className="text-sm text-ink-muted">{t("Flexible work, real pay. Shift jobs open after the legal review.")}</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {(["all", "freelance", "project"] as const).map((k) => (
          <Link key={k} href={k === "all" ? "/app/jobs" : `/app/jobs?type=${k}`} aria-current={active === k ? "page" : undefined} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${active === k ? "border-ink bg-ink text-white" : "border-stone-300 bg-white hover:bg-stone-50"}`}>
            {k === "all" ? t("All posts") : t(JOB_TYPE_LABEL[k])}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState>{t("No jobs yet.")}</EmptyState>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((j) => (
            <li key={j.id} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex gap-3">
                <AvatarImg name={j.poster.display_name} url={j.poster.avatar_url} />
                <div className="min-w-0 flex-1">
                  <Link href={`/app/jobs/${j.id}`} className="font-semibold leading-snug hover:underline">
                    {j.title}
                  </Link>
                  <p className="text-sm text-ink-muted">{j.poster.display_name}</p>
                  <p className="text-xs text-ink-muted">
                    {j.city ?? ""}
                    {j.remote_available ? ` · ${t("Remote")}` : ""} · {formatDate(j.created_at, locale)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Pill tone="neutral">{t(JOB_TYPE_LABEL[j.job_type])}</Pill>
                {j.pay_amount !== null && (
                  <p className="text-base font-bold">
                    ${j.pay_amount} <span className="text-xs font-normal text-ink-muted">{t(PAY_UNIT_LABEL[j.pay_unit])}</span>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link href="/app/jobs/new" className="fixed bottom-20 right-4 z-10 flex items-center gap-2 rounded-full bg-brand-500 px-4 py-3 font-semibold text-ink shadow-lg hover:bg-brand-400 sm:absolute sm:bottom-20" aria-label={t("Post a job")}>
        <Plus className="size-5" />
        {t("Post a job")}
      </Link>
    </main>
  );
}
