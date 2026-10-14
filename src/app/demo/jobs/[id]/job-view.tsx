"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, EmptyState, Notice, Stepper, inputClass } from "@/components/ui";
import { pick, providerBySlug, type DemoProject } from "@/lib/demo/fixtures";
import { useDemoJob, type DemoStep } from "@/lib/demo/state";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { ProviderCard, Stars } from "../../demo-ui";

const ORDER: DemoStep[] = ["accepted", "delivered", "confirmed", "reviewed"];

/** The job timeline after a quote is accepted. Both sides' actions are shown in order, labelled by who does them. */
export function JobView({ project, locale }: { project: DemoProject; locale: Locale }) {
  const t = useT();
  const { job, ready, setJob } = useDemoJob(project.id);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [disputeNote, setDisputeNote] = useState(false);

  if (!ready) return null;
  if (!job) {
    return (
      <EmptyState
        action={
          <Link href={`/demo/projects/${project.id}`}>
            <Button type="button">{t("Project page")}</Button>
          </Link>
        }
      >
        {t("No job yet. Accept a quote on the project page first.")}
      </EmptyState>
    );
  }

  const provider = providerBySlug(job.provider)!;
  const name = pick(provider.name, locale);
  const current = ORDER.indexOf(job.step);
  const steps = [t("Quote accepted"), t("Work delivered"), t("Customer confirmed"), t("Review left")];

  return (
    <div>
      <Link href={`/demo/projects/${project.id}`} className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      <p className="mt-4 text-sm text-ink-muted">{t("Job timeline")}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{pick(project.title, locale)}</h1>

      <div className="mt-6 rounded-xl border border-stone-200 p-4">
        <ProviderCard provider={provider} locale={locale} t={t} action={<p className="text-xl font-bold">${job.price}</p>} />
      </div>

      <div className="mt-8">
        <Stepper steps={steps} current={current} />
      </div>

      <section className="mt-8 rounded-xl border border-brand-300 bg-brand-50 p-4">
        <h2 className="text-sm font-medium text-brand-900">{t("Next step")}</h2>
        {job.step === "accepted" && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p>{t("Provider: mark the work as delivered")}</p>
            <Button type="button" className="px-4 py-2 text-sm" onClick={() => setJob({ ...job, step: "delivered" })}>
              {t("Mark delivered")}
            </Button>
          </div>
        )}
        {job.step === "delivered" && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p>{t("Customer: confirm the work")}</p>
            <Button type="button" className="px-4 py-2 text-sm" onClick={() => setJob({ ...job, step: "confirmed" })}>
              {t("Confirm the work")}
            </Button>
            <button type="button" className="text-sm underline" onClick={() => setDisputeNote(true)}>
              {t("Open a dispute")}
            </button>
          </div>
        )}
        {job.step === "confirmed" && (
          <form
            className="mt-2 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setJob({ ...job, step: "reviewed", stars, review: text });
            }}
          >
            <p>{t("Customer: leave a review")}</p>
            <div className="flex items-center gap-1" role="radiogroup" aria-label={t("Rating")}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={stars === n} onClick={() => setStars(n)} className={`text-2xl ${n <= stars ? "text-brand-600" : "text-stone-300"}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={inputClass} placeholder={t("Your review")} />
            <Button type="submit" className="px-4 py-2 text-sm">
              {t("Send review")}
            </Button>
          </form>
        )}
        {job.step === "reviewed" && (
          <div className="mt-2 space-y-2">
            <p>{t("Thank you. The review now appears on the profile of {name}.", { name })}</p>
            <Stars rating={job.stars ?? 5} />
            {job.review && <p className="text-sm">{job.review}</p>}
          </div>
        )}
        {disputeNote && (
          <div className="mt-3">
            <Notice tone="info">{t("In the live product this opens a dispute with Piron Work support.")}</Notice>
          </div>
        )}
      </section>

      {current >= 2 && (
        <div className="mt-6">
          <Notice tone="success">{t("This job is complete. It now counts on the profile of {name}.", { name })}</Notice>
        </div>
      )}
      <p className="mt-6 text-xs text-ink-muted">{t("Reviews are written only after a completed job.")}</p>
      <p className="mt-2 text-xs text-ink-muted">{t("Paid directly to the provider")}.</p>
    </div>
  );
}
