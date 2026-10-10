"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Notice, Pill } from "@/components/ui";
import { customer, outcome, pick, providerBySlug, quotes, request } from "@/lib/demo/fixtures";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { ProviderCard, demoDate } from "../demo-ui";

/** The future project page with its quotes. Accepting is local state only; reload to start again. */
export function ProjectDemo({ locale }: { locale: Locale }) {
  const t = useT();
  const [accepted, setAccepted] = useState<string | null>(null);
  const winner = accepted ? providerBySlug(accepted)! : null;
  const winnerQuote = accepted ? quotes.find((q) => q.provider === accepted)! : null;

  return (
    <div>
      <p className="text-sm text-ink-muted">
        {t("Customer")}: {pick(customer.name, locale)} · {pick(customer.area, locale)} · {t("Posted")} {demoDate(request.postedOn, locale)}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{pick(request.title, locale)}</h1>
      <p className="mt-4 leading-relaxed">{pick(request.details, locale)}</p>
      <p className="mt-3 text-sm text-ink-muted">
        {pick(request.category, locale)} · {t("Budget")} ${request.budgetMin} - ${request.budgetMax} · {t("Needed by")} {pick(request.neededBy, locale)}
      </p>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {t("Quotes")} ({quotes.length})
          </h2>
          {accepted ? (
            <button type="button" onClick={() => setAccepted(null)} className="text-sm font-medium underline">
              {t("Reset")}
            </button>
          ) : (
            <span className="text-sm text-ink-muted">{t("Try it: accept one quote.")}</span>
          )}
        </div>
        <ul className="mt-4 space-y-3">
          {quotes.map((q) => {
            const p = providerBySlug(q.provider)!;
            const state = !accepted ? "pending" : accepted === q.provider ? "accepted" : "declined";
            return (
              <li key={q.provider} className={`rounded-xl border p-4 ${state === "accepted" ? "border-brand-400 bg-brand-50" : state === "declined" ? "border-stone-200 opacity-60" : "border-stone-200"}`}>
                <ProviderCard
                  provider={p}
                  locale={locale}
                  t={t}
                  action={
                    <div className="text-right">
                      <p className="text-xl font-bold">${q.price}</p>
                      <p className="text-xs text-ink-muted">{q.days === 1 ? t("Delivery in 1 day") : t("Delivery in {n} days", { n: q.days })}</p>
                    </div>
                  }
                />
                <p className="mt-3 text-sm">{pick(q.note, locale)}</p>
                <div className="mt-3 flex items-center gap-3">
                  {state === "pending" && (
                    <Button type="button" onClick={() => setAccepted(q.provider)} className="px-4 py-2 text-sm">
                      {t("Accept quote")}
                    </Button>
                  )}
                  {state === "accepted" && <Pill tone="green">{t("Accepted")}</Pill>}
                  {state === "declined" && <Pill tone="neutral">{t("Declined")}</Pill>}
                  <Link href={`/demo/providers/${p.slug}`} className="text-sm font-medium underline">
                    {t("View profile")}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {winner && winnerQuote && (
        <section className="mt-8 space-y-4">
          <Notice tone="success">{t("In the live product {name} is notified now and the job starts.", { name: pick(winner.name, locale) })}</Notice>
          <div className="rounded-xl border border-stone-200 p-4">
            <h2 className="text-lg font-bold">{t("Record of completion")}</h2>
            <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
              <dt className="text-ink-muted">{t("Provider")}</dt>
              <dd>{pick(winner.name, locale)}</dd>
              <dt className="text-ink-muted">{t("Agreed price (USD)")}</dt>
              <dd>
                ${winnerQuote.price} · {t("Paid directly to the provider")}
              </dd>
              <dt className="text-ink-muted">{t("Delivered")}</dt>
              <dd>{pick(outcome.delivered, locale)}</dd>
              <dt className="text-ink-muted">{t("Status")}</dt>
              <dd>
                <Pill tone="green">{t("Completed")}</Pill>
              </dd>
            </dl>
            <p className="mt-3 text-xs text-ink-muted">{t("Reviews are written only after a completed job.")}</p>
          </div>
        </section>
      )}
    </div>
  );
}
