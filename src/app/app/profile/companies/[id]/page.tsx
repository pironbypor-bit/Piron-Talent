import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, ChevronRight, FileText } from "lucide-react";
import { EmptyState, Pill } from "@/components/ui";
import { getBusiness } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = await getBusiness(id);
  return { title: b?.name ?? "Company" };
}

/** One company: details, its openings (jobs and projects), applicants, and the two post buttons. */
export default async function CompanyPage({ params }: Props) {
  const [{ id }, t, locale] = await Promise.all([params, getT(), getLocale()]);
  const b = await getBusiness(id);
  if (!b) notFound();
  const btn = "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold";
  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/profile" className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <h1 className="text-xl font-bold">{b.name}</h1>
        <p className="text-sm text-ink-muted">{[b.description, b.city ? t(b.city) : null].filter(Boolean).join(" · ") || t("Company")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/app/jobs/new?business=${b.id}`} className={`${btn} bg-brand-500 text-ink hover:bg-brand-400`}><Briefcase className="size-4" />{t("Post a job")}</Link>
          <Link href={`/app/post/new?business=${b.id}`} className={`${btn} border border-stone-300 bg-white hover:bg-brand-50`}><FileText className="size-4" />{t("Post a project")}</Link>
        </div>
      </section>

      <h2 className="mt-5 text-sm font-semibold text-ink-muted">{t("Openings")} · {b.jobs.length} {t("part-time")} · {b.posts.length} {t("projects")}</h2>
      {b.jobs.length + b.posts.length === 0 ? (
        <div className="mt-2"><EmptyState>{t("Nothing posted under this company yet.")}</EmptyState></div>
      ) : (
        <ul className="card mt-2 divide-y divide-stone-100">
          {b.jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/app/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{j.title}</span>
                  <span className="block text-xs text-ink-muted">{t(j.job_type === "freelance" ? "Freelance" : "Project based")} · {formatDate(j.created_at, locale)}</span>
                </span>
                <Pill tone={j.applicants > 0 ? "amber" : "neutral"}>{t("{n} applicants", { n: j.applicants })}</Pill>
                <ChevronRight className="size-4 text-ink-muted" />
              </Link>
            </li>
          ))}
          {b.posts.map((p) => (
            <li key={p.id}>
              <Link href={`/app/post/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.title}</span>
                  <span className="block text-xs text-ink-muted">{t("Project")} · {formatDate(p.created_at, locale)}</span>
                </span>
                <ChevronRight className="size-4 text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-ink-muted">{t("Team: you. Inviting managers comes later.")}</p>
    </main>
  );
}
