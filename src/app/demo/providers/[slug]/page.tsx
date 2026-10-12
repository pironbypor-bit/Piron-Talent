import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill } from "@/components/ui";
import { categoryName, pick, providerBySlug, providers } from "@/lib/demo/fixtures";
import { getLocale, getT } from "@/lib/i18n/server";
import { Avatar, PortfolioGrid, Stars, demoDate } from "../../demo-ui";
import { QuoteButton } from "./quote-button";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return providers.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const p = providerBySlug(slug);
  return { title: p ? pick(p.name, locale) : "Demo" };
}

export default async function DemoProviderPage({ params }: Props) {
  const [{ slug }, t, locale] = await Promise.all([params, getT(), getLocale()]);
  const p = providerBySlug(slug);
  if (!p) notFound();
  const name = pick(p.name, locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-6">
        <Link href="/demo/providers" className="text-sm font-medium underline">
          {t("Back")}
        </Link>
      </p>
      <header className="flex items-start gap-4">
        <Avatar name={name} />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <p className="text-ink-muted">
            {pick(p.role, locale)} · {categoryName(p.category, locale)} · {pick(p.city, locale)}{p.district ? ` · ${pick(p.district, locale)}` : ""} · {p.remote ? t("Remote") : t("On site")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Stars rating={p.rating} />
            <span className="text-sm text-ink-muted">{t("{n} completed jobs", { n: p.completedJobs })}</span>
            <span className="text-sm text-ink-muted">{t("{n} years", { n: p.years })}</span>
            {p.identityChecked && <Pill tone="green">{t("Identity checked")}</Pill>}
          </div>
        </div>
      </header>

      <div className="mt-6">
        <QuoteButton name={name} />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{t("About")}</h2>
        <p className="mt-2 leading-relaxed">{pick(p.about, locale)}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {p.skills.map((s, i) => (
            <li key={i} className="rounded-full border border-stone-300 px-3 py-1 text-sm">
              {pick(s, locale)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{t("Portfolio")}</h2>
        <div className="mt-3">
          <PortfolioGrid items={p.portfolio} locale={locale} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{t("Reviews")}</h2>
        <ul className="mt-3 space-y-3">
          {p.reviews.map((r, i) => (
            <li key={i} className="rounded-xl border border-stone-200 p-4">
              <Stars rating={r.stars} />
              <p className="mt-1">{pick(r.text, locale)}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {pick(r.customer, locale)} · {demoDate(r.date, locale)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-muted">{t("Reviews are written only after a completed job.")}</p>
      </section>
    </main>
  );
}
