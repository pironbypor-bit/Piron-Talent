import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, CalendarClock, Download, FileImage, FileText, Megaphone } from "lucide-react";
import { Notice, Pill } from "@/components/ui";
import { ReportForm } from "@/app/app/report-form";
import { companyPublic } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { shareMeta } from "@/lib/seo";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ reported?: string; error?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const c = await companyPublic(id);
  if (!c) return { title: "Piron Work" };
  const meta = shareMeta({
    title: c.name,
    description: c.about ?? [c.kind, c.city ? t(c.city) : null].filter(Boolean).join(" · "),
    path: `/companies/${id}`,
    generated: true,
  });
  return c.is_public ? meta : { ...meta, robots: { index: false, follow: false } };
}

const size = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/**
 * Public company page: the company's published jobs, projects and activities, plus the files its owner made public.
 * Works without a login. Members of the company can open it while it is still off, as a preview.
 */
export default async function PublicCompanyPage({ params, searchParams }: Props) {
  const [{ id }, { reported }, t, locale] = await Promise.all([params, searchParams, getT(), getLocale()]);
  const c = await companyPublic(id);
  if (!c) notFound();
  const none = c.posts.length + c.jobs.length + c.activities.length === 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {!c.is_public && <div className="mb-4"><Notice tone="info">{t("Preview. Only people in this company can see this page until the owner turns it on.")}</Notice></div>}
      <header className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-200 text-2xl font-bold text-brand-900" aria-hidden="true">{c.name.trim().charAt(0).toUpperCase()}</span>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">{c.name}</h1>
          <p className="text-ink-muted">{[c.kind, c.city ? t(c.city) : null].filter(Boolean).join(" · ")}</p>
        </div>
      </header>
      {c.owner_checked && <p className="mt-3"><Pill tone="green">{t("Owner identity checked")}</Pill></p>}
      {c.about && <p className="mt-4 max-w-2xl whitespace-pre-line text-lg leading-relaxed">{c.about}</p>}

      <section className="mt-10">
        <h2 className="text-2xl font-bold">{t("Recent activity")}</h2>
        {none ? (
          <p className="mt-3 rounded-2xl border border-stone-200 p-5 text-ink-muted">{t("Nothing published yet.")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {c.jobs.map((j) => (
              <li key={j.id}>
                <Link href={`/app/jobs/${j.id}`} className="flex items-start gap-3 rounded-2xl border border-stone-200 p-4 hover:bg-brand-50">
                  <Briefcase className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-xs text-ink-muted">{t("Job")} · {formatDate(j.created_at, locale)}</span>
                    <span className="block font-semibold">{j.title}</span>
                    <span className="block text-sm text-ink-muted">{[j.city ? t(j.city) : null, j.pay_amount !== null ? `$${j.pay_amount} / ${t(j.pay_unit)}` : null].filter(Boolean).join(" · ")}</span>
                  </span>
                </Link>
              </li>
            ))}
            {c.posts.map((p) => (
              <li key={p.id}>
                <Link href={`/app/post/${p.id}`} className="flex items-start gap-3 rounded-2xl border border-stone-200 p-4 hover:bg-brand-50">
                  <FileText className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-xs text-ink-muted">{p.kind === "need_help" ? t("Project") : t("Post")} · {formatDate(p.created_at, locale)}</span>
                    <span className="block font-semibold">{p.title}</span>
                    <span className="block text-sm text-ink-muted">
                      {[p.city ? t(p.city) : null, p.budget_min !== null ? `$${p.budget_min}${p.budget_max !== null ? ` - $${p.budget_max}` : ""}` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {c.activities.map((a) => (
              <li key={a.id}>
                <Link href={`/app/activities/${a.id}`} className="flex items-start gap-3 rounded-2xl border border-stone-200 p-4 hover:bg-brand-50">
                  <CalendarClock className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-xs text-ink-muted">{t("Volunteer activity")}</span>
                    <span className="block font-semibold">{a.title}</span>
                    <span className="block text-sm text-ink-muted">
                      {[formatDate(a.starts_at, locale), [a.place, a.city ? t(a.city) : null].filter(Boolean).join(", "), t("{n} of {max} places taken", { n: a.joined, max: a.capacity })].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {c.documents.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">{t("Shared documents")}</h2>
          <ul className="mt-4 space-y-2">
            {c.documents.map((d) => {
              const Icon = d.mime === "application/pdf" ? FileText : FileImage;
              return (
                <li key={d.id}>
                  <a href={`/api/company-file/${d.id}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-stone-200 p-3 hover:bg-brand-50">
                    <Icon className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{d.name}</span><span className="block text-xs text-ink-muted">{size(d.bytes)}</span></span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium underline"><Download className="size-4" />{t("Download")}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {c.is_public && <ReportForm type="company" id={c.id} path={`/companies/${c.id}`} reported={reported === "1"} t={t} />}
      <p className="mt-8 flex items-center gap-2 text-sm text-ink-muted"><Megaphone className="size-4" aria-hidden="true" />{t("Piron Work shows what a company publishes. It does not guarantee any company or file.")}</p>
    </main>
  );
}
