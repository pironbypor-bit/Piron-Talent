import type { Metadata } from "next";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { CheckedPill, EmptyState, PageTitle } from "@/components/ui";
import { EmptyIllustration } from "@/components/illustrations";
import { AvatarImg } from "@/app/app/avatar";
import { listProviders, type ProviderSort } from "@/lib/app/queries";
import { categoryLabel, getCategories } from "@/lib/categories";
import { CITIES, isCity } from "@/lib/cities";
import { getLocale, getT } from "@/lib/i18n/server";

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

const chip = (on: boolean) => `shrink-0 rounded-full border px-3 py-1 text-sm font-medium ${on ? "border-brand-400 bg-brand-100 text-brand-900" : "border-stone-200 bg-white hover:bg-stone-50"}`;

/** Public directory: the same provider query as the Services tab, inside the site chrome, with clean URLs for category and city. */
export default async function ProvidersPage({ searchParams }: Props) {
  const [t, locale, categories, params] = await Promise.all([getT(), getLocale(), getCategories(), searchParams]);
  const selected = categories.find((c) => String(c.id) === params.category) ?? null;
  const q = (params.q ?? "").trim().slice(0, 60);
  const remote = params.remote === "1";
  const city = isCity(params.city) ? params.city : "";
  const sort: ProviderSort = params.sort === "completed" || params.sort === "newest" ? params.sort : "rated";
  const providers = await listProviders({ categoryId: selected?.id, q, remote, city, sort });
  const qs = (over: Partial<Params>) => {
    const p = new URLSearchParams();
    const merged: Params = { category: selected ? String(selected.id) : undefined, q: q || undefined, remote: remote ? "1" : undefined, city: city || undefined, sort: params.sort, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const str = p.toString();
    return str ? `/providers?${str}` : "/providers";
  };
  const heading =
    selected && city ? t("{category} providers in {city}", { category: categoryLabel(selected, locale), city: t(city) })
    : selected ? t("{category} providers", { category: categoryLabel(selected, locale) })
    : city ? t("Providers in {city}", { city: t(city) })
    : t("Providers in Cambodia");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <PageTitle lead={t("Checked providers with a record of completed jobs. Post what you need and compare quotes.")}>{t("Providers")}</PageTitle>

      <form action="/providers" method="get" className="space-y-2">
        {selected && <input type="hidden" name="category" value={selected.id} />}
        {remote && <input type="hidden" name="remote" value="1" />}
        {city && <input type="hidden" name="city" value={city} />}
        <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500">
          <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="sr-only">{t("Search providers")}</span>
          <input name="q" defaultValue={q} placeholder={t("Search by name, role or skill")} maxLength={60} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <button type="submit" className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-ink hover:bg-brand-400">
            {t("Search")}
          </button>
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("Category")}>
          <Link href={qs({ category: undefined })} aria-pressed={!selected} className={chip(!selected)}>{t("All categories")}</Link>
          {categories.map((c) => (
            <Link key={c.id} href={qs({ category: selected?.id === c.id ? undefined : String(c.id) })} aria-pressed={selected?.id === c.id} className={chip(selected?.id === c.id)}>
              {categoryLabel(c, locale)}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("City")}>
          <Link href={qs({ city: undefined })} aria-pressed={!city} className={chip(!city)}>{t("All cities")}</Link>
          {CITIES.map((c) => (
            <Link key={c} href={qs({ city: city === c ? undefined : c })} aria-pressed={city === c} className={chip(city === c)}>
              {t(c)}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href={qs({ remote: remote ? undefined : "1" })} aria-pressed={remote} className={chip(remote)}>{t("Remote")}</Link>
          <span className="ml-auto text-ink-muted">{t("Sort")}</span>
          <select name="sort" defaultValue={sort} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-sm" aria-label={t("Sort")}>
            <option value="rated">{t("Best rated")}</option>
            <option value="completed">{t("Most completed jobs")}</option>
            <option value="newest">{t("Newest")}</option>
          </select>
        </div>
      </form>

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
