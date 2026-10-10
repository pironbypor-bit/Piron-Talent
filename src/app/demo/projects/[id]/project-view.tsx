"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, EmptyState, Notice, Pill } from "@/components/ui";
import { pick, providerBySlug, type DemoProject } from "@/lib/demo/fixtures";
import { useDemoJob } from "@/lib/demo/state";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { ProviderCard, demoDate } from "../../demo-ui";

/** The project page: scope, deliverables, quotes to compare, accept with a confirmation. */
export function ProjectView({ project, locale, posted = false }: { project: DemoProject; locale: Locale; posted?: boolean }) {
  const t = useT();
  const { job, ready, setJob } = useDemoJob(project.id);
  const [confirming, setConfirming] = useState<string | null>(null);
  const accepted = job?.provider ?? null;
  const days = (n: number) => (n === 1 ? t("1 day") : t("{n} days", { n }));
  const stateOf = (slug: string) => (!accepted ? "pending" : accepted === slug ? "accepted" : "declined");

  return (
    <div>
      <Link href="/demo/projects" className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      {posted && (
        <div className="mt-4 space-y-2">
          <Notice tone="success">{t("Posted. Providers in this category are being notified. Quotes will appear here.")}</Notice>
          <p className="text-sm text-ink-muted">
            {t("Your project also appears in the Workspace.")}{" "}
            <Link href="/demo/workspace" className="font-medium text-ink underline">
              {t("View in Workspace")}
            </Link>
          </p>
        </div>
      )}
      <p className="mt-4 text-sm text-ink-muted">
        {t("Customer")}: {pick(project.customer.name, locale)} · {pick(project.customer.area, locale)} · {t("Posted on {date}", { date: demoDate(project.postedOn, locale) })}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{pick(project.title, locale)}</h1>
      <p className="mt-4 leading-relaxed">{pick(project.details, locale)}</p>

      <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-muted">{t("Deliverables")}</dt>
          <dd>
            <ul className="list-disc pl-5">
              {project.deliverables.map((d, i) => (
                <li key={i}>{pick(d, locale)}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="space-y-1">
          <p><span className="text-ink-muted">{t("Category")}:</span> {pick(project.categoryName, locale)}</p>
          <p><span className="text-ink-muted">{t("Budget")}:</span> ${project.budgetMin} - ${project.budgetMax}</p>
          <p><span className="text-ink-muted">{t("Deadline")}:</span> {pick(project.deadline, locale)}</p>
          <p><span className="text-ink-muted">{t("Where")}:</span> {project.remote ? t("Remote") : t("On site")}</p>
        </div>
      </dl>
      <p className="mt-4 text-xs text-ink-muted">{t("Cancellation is free before the work starts. After that both sides agree, and Piron Talent support handles disputes.")}</p>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">{t("Compare quotes")}</h2>
          {ready && accepted ? (
            <button type="button" onClick={() => setJob(null)} className="text-sm font-medium underline">
              {t("Start again")}
            </button>
          ) : (
            project.quotes.length > 0 && <span className="text-sm text-ink-muted">{t("Try it: accept one quote.")}</span>
          )}
        </div>

        {project.quotes.length === 0 ? (
          <div className="mt-4">
            <EmptyState action={<Notice tone="info">{t("In the live product a provider fills in price, days and a note here.")}</Notice>}>{t("No quotes yet.")}</EmptyState>
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-ink-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("Provider")}</th>
                    <th className="px-3 py-2 font-medium">{t("Price")}</th>
                    <th className="px-3 py-2 font-medium">{t("Delivery")}</th>
                    <th className="px-3 py-2 font-medium">{t("Rating")}</th>
                    <th className="px-3 py-2 font-medium">{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {project.quotes.map((q) => {
                    const p = providerBySlug(q.provider)!;
                    const state = stateOf(q.provider);
                    return (
                      <tr key={q.provider} className={`border-t border-stone-200 ${state === "accepted" ? "bg-brand-50" : ""}`}>
                        <td className="px-3 py-2 font-medium">{pick(p.name, locale)}</td>
                        <td className="px-3 py-2">${q.price}</td>
                        <td className="px-3 py-2">{days(q.days)}</td>
                        <td className="px-3 py-2">{p.rating.toFixed(1)}</td>
                        <td className="px-3 py-2">
                          <Pill tone={state === "accepted" ? "green" : state === "declined" ? "neutral" : "amber"}>
                            {state === "accepted" ? t("Accepted") : state === "declined" ? t("Declined") : t("Pending")}
                          </Pill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="mt-4 space-y-3">
              {project.quotes.map((q) => {
                const p = providerBySlug(q.provider)!;
                const state = stateOf(q.provider);
                return (
                  <li key={q.provider} className={`rounded-xl border p-4 ${state === "accepted" ? "border-brand-400 bg-brand-50" : state === "declined" ? "border-stone-200 opacity-60" : "border-stone-200"}`}>
                    <ProviderCard
                      provider={p}
                      locale={locale}
                      t={t}
                      action={
                        <div className="text-right">
                          <p className="text-xl font-bold">${q.price}</p>
                          <p className="text-xs text-ink-muted">{days(q.days)}</p>
                        </div>
                      }
                    />
                    <p className="mt-3 text-sm">{pick(q.note, locale)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {ready && state === "pending" && confirming !== q.provider && (
                        <Button type="button" onClick={() => setConfirming(q.provider)} className="px-4 py-2 text-sm">
                          {t("Accept quote")}
                        </Button>
                      )}
                      {confirming === q.provider && state === "pending" && (
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm">
                          <span>{t("Accept this quote for {price}?", { price: `$${q.price}` })}</span>
                          <Button
                            type="button"
                            className="px-3 py-1.5 text-sm"
                            onClick={() => {
                              setJob({ provider: q.provider, price: q.price, step: "accepted" });
                              setConfirming(null);
                            }}
                          >
                            {t("Confirm")}
                          </Button>
                          <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm" onClick={() => setConfirming(null)}>
                            {t("Cancel")}
                          </Button>
                        </div>
                      )}
                      <Link href={`/demo/providers/${p.slug}`} className="text-sm font-medium underline">
                        {t("View profile")}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {ready && accepted && (
        <div className="mt-8 space-y-3">
          <Notice tone="success">{t("In the live product {name} is notified now and the job starts.", { name: pick(providerBySlug(accepted)!.name, locale) })}</Notice>
          <Link href={`/demo/jobs/${project.id}`}>
            <Button type="button">{t("Go to the job")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
