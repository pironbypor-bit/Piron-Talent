import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, inputClass, Notice, Pill } from "@/components/ui";
import { applyToJob } from "@/lib/app/actions";
import { getJob, getMe } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { statusLabel, statusTone } from "@/lib/pilot";
import { AvatarImg } from "../../avatar";
import { ReportForm } from "../../report-form";
import { JOB_TYPE_LABEL, PAY_UNIT_LABEL } from "../page";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; reported?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getJob(id);
  return { title: data?.job.title ?? "Piron Work" };
}

export default async function JobPage({ params, searchParams }: Props) {
  const [{ id }, { error, reported }, t, locale, me] = await Promise.all([params, searchParams, getT(), getLocale(), getMe()]);
  const data = await getJob(id);
  if (!data) notFound();
  const { job, mine, application, applicants } = data;
  const apply = applyToJob.bind(null, job.id);
  const path = `/app/jobs/${job.id}`;

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/jobs" className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      <h1 className="mt-3 text-2xl font-bold leading-tight">{job.title}</h1>
      <div className="mt-2 flex items-center gap-3">
        <AvatarImg name={job.poster.display_name} url={job.poster.avatar_url} />
        <div>
          <p className="font-semibold">{job.poster.display_name}</p>
          <p className="text-xs text-ink-muted">
            {job.city ?? ""}
            {job.remote_available ? ` · ${t("Remote")}` : ""} · {formatDate(job.created_at, locale)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill tone="neutral">{t(JOB_TYPE_LABEL[job.job_type])}</Pill>
        {job.pay_amount !== null && (
          <span className="font-bold">
            ${job.pay_amount} <span className="text-xs font-normal text-ink-muted">{t(PAY_UNIT_LABEL[job.pay_unit])}</span>
          </span>
        )}
      </div>
      <p className="mt-4 whitespace-pre-wrap leading-relaxed">{job.description}</p>

      {mine ? (
        <section className="mt-6">
          <h2 className="font-semibold">
            {t("Applicants")} ({applicants.length})
          </h2>
          {applicants.length === 0 && <p className="mt-1 text-sm text-ink-muted">{t("Nothing yet.")}</p>}
          <ul className="mt-2 space-y-2">
            {applicants.map((a) => (
              <li key={a.id} className="card p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/app/providers/${a.applicant.id}`} className="font-semibold hover:underline">
                    {a.applicant.display_name}
                  </Link>
                  <Pill tone={statusTone(a.status)}>{statusLabel(t, a.status === "submitted" ? "new" : a.status)}</Pill>
                </div>
                {a.cover_note && <p className="mt-1 text-sm">{a.cover_note}</p>}
                <p className="mt-1 text-xs text-ink-muted">{formatDate(a.created_at, locale)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : application ? (
        <div className="mt-6">
          <Notice tone="success">{t("You applied.")}</Notice>
        </div>
      ) : me ? (
        <form action={apply} className="mt-6 space-y-2 rounded-2xl border border-brand-300 bg-brand-50 p-4">
          <h2 className="font-semibold">{t("Apply")}</h2>
          <textarea name="cover_note" rows={3} className={inputClass} placeholder={t("Cover note")} />
          <Button type="submit" className="px-4 py-2 text-sm">
            {t("Apply")}
          </Button>
        </form>
      ) : (
        <p className="mt-6 text-sm">
          <Link href={`/login?next=${encodeURIComponent(path)}`} className="font-medium underline">
            {t("Log in to continue")}
          </Link>
        </p>
      )}
      {error && <div className="mt-4"><Notice tone="error">{t("Something went wrong: {error}", { error })}</Notice></div>}
      {me && !mine && <ReportForm type="job" id={job.id} path={path} reported={reported === "1"} t={t} />}
    </main>
  );
}
