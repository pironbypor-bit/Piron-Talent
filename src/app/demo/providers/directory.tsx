"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { DEMO_CATEGORIES, DEMO_CITIES, categoryName, pick, providers, type CityKey } from "@/lib/demo/fixtures";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { ProviderCard } from "../demo-ui";

type Sort = "rated" | "completed" | "experienced";
export type DirectoryInitial = { category?: string; city?: string; q?: string };

const chip = (on: boolean) => `rounded-full border px-3 py-1 text-sm font-medium ${on ? "border-brand-400 bg-brand-100 text-brand-900" : "border-stone-200 bg-white hover:bg-stone-50"}`;

/** Public directory demo: search, category and city chips, remote, sort. The heading follows the filters. */
export function Directory({ locale, initial = {} }: { locale: Locale; initial?: DirectoryInitial }) {
  const t = useT();
  const [q, setQ] = useState(initial.q ?? "");
  const [category, setCategory] = useState(DEMO_CATEGORIES.some((c) => c.slug === initial.category) ? initial.category! : "");
  const [city, setCity] = useState<CityKey | "">(DEMO_CITIES.some((c) => c.key === initial.city) ? (initial.city as CityKey) : "");
  const [remote, setRemote] = useState(false);
  const [sort, setSort] = useState<Sort>("rated");

  const term = q.trim().toLowerCase();
  const hit = (p: (typeof providers)[number]) =>
    !term ||
    [p.name.en, p.name.km, p.role.en, p.role.km, ...p.skills.flatMap((s) => [s.en, s.km])].some((x) => x.toLowerCase().includes(term));
  const list = providers
    .filter((p) => (!category || p.category === category) && (!city || p.cityKey === city || (remote && p.remote)) && (!remote || p.remote) && hit(p))
    .sort((a, b) => (sort === "completed" ? b.completedJobs - a.completedJobs : sort === "experienced" ? b.years - a.years : b.rating - a.rating || b.completedJobs - a.completedJobs));

  const cityName = city ? pick(DEMO_CITIES.find((c) => c.key === city)!.name, locale) : "";
  const catName = category ? categoryName(category, locale) : "";
  const heading =
    category && city ? t("{category} providers in {city}", { category: catName, city: cityName })
    : category ? t("{category} providers", { category: catName })
    : city ? t("Providers in {city}", { city: cityName })
    : t("Providers in Cambodia");

  return (
    <div>
      <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500">
        <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <span className="sr-only">{t("Search providers")}</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search by name, role or skill")} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </label>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("Category")}>
        <button type="button" onClick={() => setCategory("")} aria-pressed={!category} className={chip(!category)}>{t("All categories")}</button>
        {DEMO_CATEGORIES.map((c) => (
          <button key={c.slug} type="button" onClick={() => setCategory(category === c.slug ? "" : c.slug)} aria-pressed={category === c.slug} className={chip(category === c.slug)}>
            {pick(c.name, locale)}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("City")}>
        <button type="button" onClick={() => setCity("")} aria-pressed={!city} className={chip(!city)}>{t("All cities")}</button>
        {DEMO_CITIES.map((c) => (
          <button key={c.key} type="button" onClick={() => setCity(city === c.key ? "" : c.key)} aria-pressed={city === c.key} className={chip(city === c.key)}>
            {pick(c.name, locale)}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={() => setRemote(!remote)} aria-pressed={remote} className={chip(remote)}>{t("Remote")}</button>
        <span className="ml-auto text-ink-muted">{t("Sort")}</span>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-sm" aria-label={t("Sort")}>
          <option value="rated">{t("Best rated")}</option>
          <option value="completed">{t("Most completed jobs")}</option>
          <option value="experienced">{t("Most experienced")}</option>
        </select>
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">{heading}</h2>
        <span className="text-sm text-ink-muted">{t("{n} providers", { n: list.length })}</span>
      </div>

      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState>{t("No providers match these filters.")}</EmptyState>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((p) => (
            <li key={p.slug} className="rounded-xl border border-stone-200 p-4">
              <ProviderCard
                provider={p}
                locale={locale}
                t={t}
                action={
                  <Link href={`/demo/providers/${p.slug}`} className="shrink-0 text-sm font-medium underline">
                    {t("View profile")}
                  </Link>
                }
              />
              <p className="mt-2 text-sm text-ink-muted">
                {categoryName(p.category, locale)} · {pick(p.city, locale)}
                {p.district ? ` · ${pick(p.district, locale)}` : ""} · {p.remote ? t("Remote") : t("On site")}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {p.skills.map((s, i) => (
                  <li key={i} className="rounded-full border border-stone-300 px-2.5 py-0.5 text-xs">
                    {pick(s, locale)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
