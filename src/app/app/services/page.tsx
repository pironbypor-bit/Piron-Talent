import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Star } from "lucide-react";
import { CheckedPill, EmptyState } from "@/components/ui";
import { EmptyIllustration } from "@/components/illustrations";
import { toggleKeepProvider } from "@/lib/app/actions";
import { listProviders, type ProviderSort } from "@/lib/app/queries";
import { categoryLabel, getCategories } from "@/lib/categories";
import { CITIES, isCity } from "@/lib/cities";
import { ProviderFilters } from "@/components/provider-filters";
import { getLocale, getT } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import { hasFeature } from "@/lib/app/features";
import { AvailablePill, replyText } from "@/components/signals";
import { AvatarImg } from "../avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Services") };
}

/** Services tab: search and filters at the top, then providers who marked themselves available. */
type Params = { category?: string; q?: string; remote?: string; city?: string; sort?: string };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const [t, locale, categories, params, threePages] = await Promise.all([getT(), getLocale(), getCategories(), searchParams, hasFeature("home_pages")]);
  // Home in three pages: this page is now Professionals. Old and shared links keep their search words.
  if (threePages) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    redirect(`/app/professionals${sp.toString() ? `?${sp}` : ""}`);
  }
  const selected = categories.find((c) => String(c.id) === params.category) ?? null;
  const q = (params.q ?? "").trim().slice(0, 60);
  const remote = params.remote === "1";
  const city = isCity(params.city) ? params.city : "";
  const sort: ProviderSort = params.sort === "completed" || params.sort === "newest" ? params.sort : "rated";
  const providers = await listProviders({ categoryId: selected?.id, q, remote, city, sort });
  const searching = Boolean(q || remote || city || (params.sort && params.sort !== "rated"));
  const qs = (over: Partial<Params>) => {
    const p = new URLSearchParams();
    const merged: Params = { category: selected ? String(selected.id) : undefined, q: q || undefined, remote: remote ? "1" : undefined, city: city || undefined, sort: params.sort, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const str = p.toString();
    return str ? `/app/services?${str}` : "/app/services";
  };
  const path = qs({});
  return (
    <main className="px-4 pb-24 pt-4">
      <ProviderFilters
        action="/app/services"
        q={q}
        category={selected ? String(selected.id) : ""}
        categories={categories.map((c) => ({ value: String(c.id), label: categoryLabel(c, locale) }))}
        city={city}
        cities={CITIES.map((c) => ({ value: c, label: t(c) }))}
        remote={remote}
        sort={sort}
      />

      <h2 className="mt-5 text-lg font-bold">{selected && city ? t("{category} providers in {city}", { category: categoryLabel(selected, locale), city: t(city) }) : selected ? categoryLabel(selected, locale) : city ? t("Providers in {city}", { city: t(city) }) : searching ? t("Results") : t("Popular providers")}</h2>
      {providers.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            illustration={<EmptyIllustration kind="people" />}
            action={
              <Link href="/app/profile/edit" className="inline-block rounded-full bg-brand-500 px-4 py-2 font-semibold text-ink hover:bg-brand-400">
                {t("I offer services (show me in Services)")}
              </Link>
            }
          >
            {searching ? t("No results. Try another word.") : t("No providers yet.")}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {providers.map((p) => {
            const keep = toggleKeepProvider.bind(null, p.id, path);
            return (
              <li key={p.id} className="card flex items-center gap-3 p-3">
                <AvatarImg name={p.display_name} url={p.avatar_url} size={14} />
                <div className="min-w-0 flex-1">
                  <Link href={`/app/providers/${p.id}`} className="block truncate font-semibold hover:underline">
                    {p.role_line || p.display_name}
                  </Link>
                  <p className="truncate text-sm text-ink-muted">
                    {p.display_name}
                    {p.city ? ` · ${t(p.city)}${p.district ? ` · ${p.district}` : ""}` : ""}
                    {p.remote ? ` · ${t("Remote")}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {p.identity_checked ? <CheckedPill>{t("Identity checked")}</CheckedPill> : <span className="rounded-full bg-stone-100 px-2 py-0.5 text-ink-muted">{t("New")}</span>}
                    <span className="text-ink-muted">{t("{n} completed jobs", { n: p.completed_jobs })}</span>
                    <AvailablePill s={p} t={t} />
                    {replyText(t, p) && <span className="text-ink-muted">{replyText(t, p)}</span>}
                    {p.rating !== null && (
                      <span className="inline-flex items-center gap-0.5 text-ink">
                        <Star className="size-3.5 fill-brand-500 text-brand-500" aria-hidden="true" />
                        {p.rating.toFixed(1)} <span className="text-ink-muted">({t("{n} reviews", { n: p.reviews })})</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {p.price_from && <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-900">{p.price_from}</span>}
                  <div className="flex items-center gap-1">
                    <form action={keep}>
                      <button type="submit" aria-pressed={p.saved} aria-label={p.saved ? t("Kept") : t("Keep")} className={`rounded-full border p-1.5 ${p.saved ? "border-brand-400 bg-brand-100" : "border-stone-200 hover:bg-stone-50"}`}>
                        <Bookmark className={`size-4 ${p.saved ? "fill-current" : ""}`} />
                      </button>
                    </form>
                    <Link href={`/app/providers/${p.id}`} className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-400">
                      {t("Request a quote")}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
