"use client";

import Link from "next/link";
import { Button, EmptyState, Pill } from "@/components/ui";
import { pick, projectById, providerBySlug, providers, story } from "@/lib/demo/fixtures";
import { useDemoJobs, type DemoStep } from "@/lib/demo/state";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { ProviderCard } from "../demo-ui";

const STEP_TEXT: Record<DemoStep, string> = {
  quotes: "Pending",
  accepted: "In progress",
  delivered: "Work delivered",
  confirmed: "Completed",
  reviewed: "Completed",
};

/** The customer's home: what is running, what to do next, who to hire again. Reads the demo state of this tab. */
export function DashboardView({ locale }: { locale: Locale }) {
  const t = useT();
  const jobs = useDemoJobs();
  const entries = Object.entries(jobs);
  // The cafe story counts once: from this tab's demo state if it exists, otherwise from the fixture outcome.
  const sessionSpend = entries.filter(([, j]) => j.step === "confirmed" || j.step === "reviewed").reduce((sum, [, j]) => sum + j.price, 0);
  const spend = sessionSpend + (jobs[story.id] ? 0 : (story.outcome?.price ?? 0));
  const saved = [providerBySlug(story.outcome!.acceptedProvider)!, providers[3]];

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold">{t("Active jobs")}</h2>
        {entries.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              action={
                <Link href="/demo/projects">
                  <Button type="button" variant="secondary">
                    {t("Projects")}
                  </Button>
                </Link>
              }
            >
              {t("No job yet. Accept a quote on the project page first.")}
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200">
            {entries.map(([id, job]) => {
              const project = projectById(id);
              const provider = providerBySlug(job.provider);
              if (!project || !provider) return null;
              const done = job.step === "confirmed" || job.step === "reviewed";
              return (
                <li key={id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <Link href={`/demo/jobs/${id}`} className="font-semibold hover:underline">
                      {pick(project.title, locale)}
                    </Link>
                    <p className="text-sm text-ink-muted">
                      {pick(provider.name, locale)} · ${job.price}
                    </p>
                  </div>
                  <Pill tone={done ? "green" : "amber"}>{t(STEP_TEXT[job.step])}</Pill>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 p-4">
          <p className="text-sm text-ink-muted">{t("Spend this month")}</p>
          <p className="mt-1 text-2xl font-bold">${spend}</p>
          <p className="text-xs text-ink-muted">{t("Paid directly to the provider")}</p>
        </div>
        <div className="rounded-xl border border-stone-200 p-4">
          <p className="text-sm text-ink-muted">{t("Recent messages")}</p>
          <Link href="/demo/messages" className="mt-1 block font-semibold hover:underline">
            {pick(providerBySlug(story.quotes[0].provider)!.name, locale)}
          </Link>
          <p className="truncate text-sm text-ink-muted">{locale === "km" ? "ល្អណាស់។ តុជិតបង្អួច..." : "Perfect. A window table..."}</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">{t("Saved providers")}</h2>
        <ul className="mt-3 space-y-3">
          {saved.map((p) => (
            <li key={p.slug} className="rounded-xl border border-stone-200 p-4">
              <ProviderCard
                provider={p}
                locale={locale}
                t={t}
                action={
                  <Link href={`/demo/providers/${p.slug}`} className="shrink-0">
                    <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm">
                      {t("Hire again")}
                    </Button>
                  </Link>
                }
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
