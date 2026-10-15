import Link from "next/link";
import { Star } from "lucide-react";
import { Button, CheckedPill } from "@/components/ui";
import { TrustBlock } from "@/components/home-blocks";
import { AvailablePill, replyText } from "@/components/signals";
import { AvatarImg } from "@/app/app/avatar";
import { categoryLabel } from "@/lib/categories";
import { CATEGORY_CONTENT } from "@/lib/category-pages";
import type { CategoryPageData } from "@/lib/category-page-data";
import { citySlug } from "@/lib/cities";
import { SITE_URL } from "@/lib/site";
import type { Locale } from "@/lib/i18n/core";
import type { T } from "@/lib/i18n/core";

const MAX_PROVIDERS = 8;

/** Structured data for search engines; "<" is escaped so the text can never close the script tag. */
function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }} />;
}

/**
 * Public category page: /services/<category> and /services/<category>/<city>.
 * Real content (tasks, what to prepare, how to choose, questions) plus the live provider list and a clear way to post a project.
 */
export function CategoryPage({ data, t, locale }: { data: CategoryPageData; t: T; locale: Locale }) {
  const { category, content, city, providers, cities } = data;
  const name = categoryLabel(category, locale);
  const where = city ? t(city) : t("Cambodia");
  const heading = city ? t("{category} providers in {city}", { category: name, city: where }) : t("{category} providers", { category: name });
  const base = `/services/${category.slug}`;
  const path = city ? `${base}/${citySlug(city)}` : base;
  const post = `/post-project?${new URLSearchParams({ category: String(category.id), source: `services-${category.slug}` }).toString()}`;
  const shown = providers.slice(0, MAX_PROVIDERS);
  const otherCities = cities.filter((c) => c.city !== city).slice(0, 8);
  const faqs: [string, string][] = [["How much does it cost?", "Posting a project is free. You agree a price with the provider and pay them directly."], ...content.faqs];

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Piron Work", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: t("Services"), item: `${SITE_URL}/services` },
        { "@type": "ListItem", position: 3, name, item: `${SITE_URL}${base}` },
        ...(city ? [{ "@type": "ListItem", position: 4, name: where, item: `${SITE_URL}${path}` }] : []),
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: t(q), acceptedAnswer: { "@type": "Answer", text: t(a) } })),
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <JsonLd data={ld} />
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/services" className="hover:underline">{t("Services")}</Link>
        {" › "}
        {city ? <Link href={base} className="hover:underline">{name}</Link> : <span>{name}</span>}
        {city && <>{" › "}<span>{where}</span></>}
      </nav>

      <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{heading}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-muted">{t(content.lead)}</p>
      <p className="mt-2 max-w-2xl leading-relaxed text-ink-muted">{t("Post what you need, compare quotes and pay the provider directly.")}</p>
      <p className="mt-6">
        <Link href={post} className="inline-block">
          <Button type="button">{t("Post a project")}</Button>
        </Link>
      </p>

      {content.caution && <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">{t(content.caution)}</p>}

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl font-bold">{t("Available providers")}</h2>
          {providers.length > 0 && <span className="text-sm text-ink-muted">{t("{n} providers", { n: providers.length })}</span>}
        </div>
        {shown.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-stone-200 p-5 leading-relaxed text-ink-muted">
            {t("No providers have joined this category here yet. Post a project and the Piron Work team will look for one.")}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {shown.map((p) => (
              <li key={p.id} className="flex items-start gap-3 rounded-2xl border border-stone-200 p-4">
                <AvatarImg name={p.display_name} url={p.avatar_url} size={14} />
                <div className="min-w-0 flex-1">
                  <Link href={`/providers/${p.id}`} className="block font-semibold hover:underline">{p.display_name}</Link>
                  <p className="text-sm text-ink-muted">
                    {p.role_line ?? ""}
                    {p.city ? ` · ${t(p.city)}` : ""}
                    {p.remote ? ` · ${t("Remote")}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {p.identity_checked ? <CheckedPill>{t("Identity checked")}</CheckedPill> : <span className="rounded-full bg-stone-100 px-2 py-0.5 text-ink-muted">{t("New")}</span>}
                    <span className="text-ink-muted">{t("{n} completed jobs", { n: p.completed_jobs })}</span>
                    <AvailablePill s={p} t={t} />
                    {replyText(t, p) && <span className="text-ink-muted">{replyText(t, p)}</span>}
                    {p.rating !== null && (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="size-3.5 fill-brand-500 text-brand-500" aria-hidden="true" />
                        {p.rating.toFixed(1)} <span className="text-ink-muted">({t("{n} reviews", { n: p.reviews })})</span>
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/providers/${p.id}`} className="shrink-0 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-400">{t("View profile")}</Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm">
          <Link href={`/providers?category=${category.id}${city ? `&city=${encodeURIComponent(city)}` : ""}`} className="font-medium underline">{t("See all providers")}</Link>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">{t("Common tasks")}</h2>
        <p className="mt-1 text-ink-muted">{t("Pick one to start the form with it filled in.")}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {content.tasks.map((task) => (
            <li key={task}>
              <Link
                href={`${post}&${new URLSearchParams({ details: t(task) }).toString()}`}
                className="inline-block rounded-full border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-brand-50"
              >
                {t(task)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">{t("What to prepare")}</h2>
          <ul className="mt-3 space-y-2">
            {content.prepare.map((x) => (
              <li key={x} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                {t(x)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold">{t("How to choose")}</h2>
          <ul className="mt-3 space-y-2">
            {content.choose.map((x) => (
              <li key={x} className="flex gap-2 text-sm leading-relaxed">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                {t(x)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-12">
        <TrustBlock t={t} />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">{t("Questions")}</h2>
        <dl className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200">
          {faqs.map(([q, a]) => (
            <div key={q} className="px-5 py-4">
              <dt className="font-semibold">{t(q)}</dt>
              <dd className="mt-1 leading-relaxed text-ink-muted">{t(a)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {otherCities.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">{t("{category} in other places", { category: name })}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <li key={c.city}>
                <Link href={`${base}/${citySlug(c.city)}`} className="inline-block rounded-full border border-stone-300 px-3 py-1.5 text-sm hover:bg-brand-50">{t(c.city)}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-bold">{t("Other services")}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {CATEGORY_CONTENT.filter((c) => c.slug !== category.slug).map((c) => (
            <li key={c.slug}>
              <Link href={city ? `/services/${c.slug}/${citySlug(city)}` : `/services/${c.slug}`} className="inline-block rounded-full border border-stone-300 px-3 py-1.5 text-sm hover:bg-brand-50">
                {t(c.people.charAt(0).toUpperCase() + c.people.slice(1))}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
