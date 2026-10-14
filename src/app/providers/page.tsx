import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { CheckedPill, EmptyState, PageTitle } from "@/components/ui";
import { EmptyIllustration } from "@/components/illustrations";
import { AvatarImg } from "@/app/app/avatar";
import { listProviders, type ProviderSort } from "@/lib/app/queries";
import { categoryLabel, getCategories } from "@/lib/categories";
import { CITIES, isCity } from "@/lib/cities";
import { ProviderFilters } from "@/components/provider-filters";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvailablePill, replyText } from "@/components/signals";

type Params = { category?: string; q?: string; remote?: string; city?: string; sort?: string };
type Props = { searchParams: Promise<Params> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [t, locale, categories, params] = await Promise.all([getT(), getLocale(), getCategories(), searchParams]);
  const selected = categories.find((c) => String(c.id) === params.category) ?? null;
  const city = isCity(params.city) ? params.city : "";
  const title =
    selected && city ? t("{category} providers in {city}", { category: categoryLabel(selected, locale), city: t(city) })
    : selected ? t("{category} providers", { category: categoryLabel(selected, locale) })
    : city ? t("Providers in {city}", { city: t(city) })
    : t("Providers in Cambodia");
  return { title, description: t("Checked providers with a record of completed jobs. Post what you need and compare quotes.") };
}

/** Public directory: the same provider query as the Services tab, inside the site chrome, with clean URLs for category and city. */
export default async function ProvidersPage({ searchParams }: Props) {
  const [t, locale, categories, params] = await Promise.all([getT(), getLocale(), getCategories(), searchParams]);
  const selected = categories.find((c) => String(c.id) === params.category) ?? null;
  const q = (params.q ?? "").trim().slice(0, 60);
  const remote = params.remote === "1";
  const city = isCity(params.city) ? params.city : "";
  const sort: ProviderSort = params.sort === "completed" || params.sort === "newest" ? params.sort : "rated";
  const providers = await listProviders({ categoryId: selected?.id, q, remote, city, sort });
  const heading =
    selected && city ? t("{category} providers in {city}", { category: categoryLabel(selected, locale), city: t(city) })
    : selected ? t("{category} providers", { category: categoryLabel(selected, locale) })
    : city ? t("Providers in {city}", { city: t(city) })
    : t("Providers in Cambodia");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <PageTitle lead={t("Checked providers with a record of completed jobs. Post what you need and compare quotes.")}>{t("Providers")}</PageTitle>

      <ProviderFilters
        action="/providers"
        q={q}
        category={selected ? String(selected.id) : ""}
        categories={categories.map((c) => ({ value: String(c.id), label: categoryLabel(c, locale) }))}
        city={city}
        cities={CITIES.map((c) => ({ value: c, label: t(c) }))}
        remote={remote}
        sort={sort}
      />

      <div className="mt-8 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">{heading}</h2>
        <span className="text-sm text-ink-muted">{t("{n} providers", { n: providers.length })}</span>
      </div>

      {providers.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            illustration={<EmptyIllustration kind="people" />}
            action={
              <Link href="/post-project" className="inline-block rounded-full bg-brand-500 px-4 py-2 font-semibold text-ink hover:bg-brand-400">
                {t("Post a project")}
              </Link>
            }
          >
            {t("No providers match these filters.")}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {providers.map((p) => (
            <li key={p.id} className="flex items-start gap-3 rounded-2xl border border-stone-200 p-4">
              <AvatarImg name={p.display_name} url={p.avatar_url} size={14} />
              <div className="min-w-0 flex-1">
                <Link href={`/providers/${p.id}`} className="block font-semibold hover:underline">
                  {p.display_name}
                </Link>
                <p className="text-sm text-ink-muted">
                  {p.role_line ?? ""}
                  {p.city ? ` · ${t(p.city)}${p.district ? ` · ${p.district}` : ""}` : ""}
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
                {p.skills.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {p.skills.slice(0, 5).map((s) => (
                      <li key={s} className="rounded-full border border-stone-300 px-2.5 py-0.5 text-xs">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {p.price_from && <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-900">{p.price_from}</span>}
                <Link href={`/providers/${p.id}`} className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-400">
                  {t("View profile")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
