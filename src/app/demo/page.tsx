import type { Metadata } from "next";
import Link from "next/link";
import { Button, PageTitle, Pill } from "@/components/ui";
import { customer, outcome, pick, providerBySlug, quotes, request } from "@/lib/demo/fixtures";
import { getLocale, getT } from "@/lib/i18n/server";
import { ProviderCard, Stars, demoDate } from "./demo-ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("See a sample project") };
}

export default async function DemoOverviewPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const winner = providerBySlug(outcome.acceptedProvider)!;
  const review = winner.reviews[0];

  const steps: { title: string; body: React.ReactNode }[] = [
    {
      title: t("The request"),
      body: (
        <div className="rounded-xl border border-stone-200 p-4">
          <p className="text-sm text-ink-muted">
            {t("Customer")}: {pick(customer.name, locale)} · {pick(customer.area, locale)} · {t("Posted")} {demoDate(request.postedOn, locale)}
          </p>
          <p className="mt-1 text-lg font-semibold">{pick(request.title, locale)}</p>
          <p className="mt-2 leading-relaxed">{pick(request.details, locale)}</p>
          <p className="mt-3 text-sm text-ink-muted">
            {pick(request.category, locale)} · {t("Budget")} ${request.budgetMin} - ${request.budgetMax} · {t("Needed by")} {pick(request.neededBy, locale)}
          </p>
        </div>
      ),
    },
    {
      title: t("Quotes"),
      body: (
        <div className="space-y-3">
          <p className="text-ink-muted">{t("Three providers answer within one working day. Each quote shows the price, the delivery time and what is included.")}</p>
          <ul className="space-y-3">
            {quotes.map((q) => {
              const p = providerBySlug(q.provider)!;
              return (
                <li key={q.provider} className="rounded-xl border border-stone-200 p-4">
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
                </li>
              );
            })}
          </ul>
        </div>
      ),
    },
    {
      title: t("The match"),
      body: (
        <div className="rounded-xl border border-brand-300 bg-brand-50 p-4">
          <p className="text-ink-muted">{t("The customer accepts one quote. The provider is notified and the work starts. Payment goes directly to the provider.")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Pill tone="green">{t("Accepted")}</Pill>
            <span className="font-semibold">{pick(winner.name, locale)}</span>
            <span>${outcome.price}</span>
            <span className="text-sm text-ink-muted">{demoDate(outcome.acceptedOn, locale)}</span>
          </div>
        </div>
      ),
    },
    {
      title: t("Record of completion"),
      body: (
        <div className="rounded-xl border border-stone-200 p-4">
          <p className="text-ink-muted">{t("When the work is delivered, both sides confirm. The job becomes a record on the provider's profile, and the customer can leave a review.")}</p>
          <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <dt className="text-ink-muted">{t("Job completed")}</dt>
            <dd>{demoDate(outcome.completedOn, locale)}</dd>
            <dt className="text-ink-muted">{t("Delivered")}</dt>
            <dd>{pick(outcome.delivered, locale)}</dd>
            <dt className="text-ink-muted">{t("Agreed price (USD)")}</dt>
            <dd>
              ${outcome.price} · {t("Paid directly to the provider")}
            </dd>
          </dl>
          <blockquote className="mt-4 border-l-4 border-brand-300 pl-3">
            <Stars rating={review.stars} />
            <p className="mt-1">{pick(review.text, locale)}</p>
            <p className="text-sm text-ink-muted">{pick(review.customer, locale)}</p>
          </blockquote>
          <p className="mt-3 text-xs text-ink-muted">{t("Reviews are written only after a completed job.")}</p>
        </div>
      ),
    },
    {
      title: t("Hire again"),
      body: (
        <div className="rounded-xl border border-stone-200 p-4">
          <p className="text-ink-muted">{t("Next month the cafe has new drinks. One tap sends a new request to the same provider.")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href={`/demo/providers/${winner.slug}`}>
              <Button type="button">{t("Hire again")}</Button>
            </Link>
            <span className="text-sm text-ink-muted">{pick(winner.name, locale)}</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageTitle lead={t("A cafe in Toul Kork needs product photos. Here is what happens, step by step.")}>{t("How one project runs on Piron Talent")}</PageTitle>
      <ol className="space-y-10">
        {steps.map((s, i) => (
          <li key={s.title} className="grid gap-3 sm:grid-cols-[2.5rem_1fr]">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold">{i + 1}</span>
            <div>
              <h2 className="mb-3 text-xl font-bold">{s.title}</h2>
              {s.body}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-12">
        <Link href="/demo/project" className="font-semibold underline">
          {t("Open the project page")}
        </Link>
        <span className="ml-2 text-ink-muted">({t("Try it: accept one quote.")})</span>
      </p>
    </main>
  );
}
