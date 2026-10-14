"use client";

import { useRef } from "react";
import { Search } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// Search and filters for the provider lists (Services tab and the public directory). Plain GET form, so every
// result has a shareable URL. The category and province dropdowns list every option and apply on change.

export type FilterOption = { value: string; label: string };
type Props = { action: string; q: string; category: string; categories: FilterOption[]; city: string; cities: FilterOption[]; remote: boolean; sort: string };

const select = "w-full rounded-full border border-stone-200 bg-white px-3 py-2 text-sm";

export function ProviderFilters({ action, q, category, categories, city, cities, remote, sort }: Props) {
  const t = useT();
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();

  return (
    <form ref={form} action={action} method="get" className="space-y-2">
      <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500">
        <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <span className="sr-only">{t("Search providers")}</span>
        <input name="q" defaultValue={q} placeholder={t("Search by name, role or skill")} maxLength={60} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        <button type="submit" className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-ink hover:bg-brand-400">
          {t("Search")}
        </button>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="sr-only">{t("Category")}</span>
          <select name="category" defaultValue={category} onChange={submit} className={select}>
            <option value="">{t("All categories")}</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">{t("Province or city")}</span>
          <select name="city" defaultValue={city} onChange={submit} className={select}>
            <option value="">{t("All provinces and cities")}</option>
            {cities.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 font-medium has-[:checked]:border-brand-400 has-[:checked]:bg-brand-100">
          <input type="checkbox" name="remote" value="1" defaultChecked={remote} onChange={submit} className="accent-brand-500" />
          {t("Remote")}
        </label>
        <span className="ml-auto text-ink-muted">{t("Sort")}</span>
        <select name="sort" defaultValue={sort} onChange={submit} className="rounded-full border border-stone-200 bg-white px-2 py-1 text-xs">
          <option value="rated">{t("Best rated")}</option>
          <option value="completed">{t("Most completed jobs")}</option>
          <option value="newest">{t("Newest")}</option>
        </select>
      </div>
    </form>
  );
}
