"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, inputClass } from "@/components/ui";
import { DEMO_CATEGORIES, categoryName, pick, providers } from "@/lib/demo/fixtures";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { ProviderCard } from "../demo-ui";

/** Provider directory with the three filters that matter first: category, remote, rating. */
export function Directory({ locale }: { locale: Locale }) {
  const t = useT();
  const [category, setCategory] = useState("");
  const [remote, setRemote] = useState(false);
  const [top, setTop] = useState(false);
  const list = providers.filter((p) => (!category || p.category === category) && (!remote || p.remote) && (!top || p.rating >= 4.8));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} w-auto py-1.5`} aria-label={t("Category")}>
          <option value="">{t("All categories")}</option>
          {DEMO_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {pick(c.name, locale)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} /> {t("Remote work")}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={top} onChange={(e) => setTop(e.target.checked)} /> {t("Rating 4.8 and above")}
        </label>
        <span className="text-ink-muted">{t("{n} providers", { n: list.length })}</span>
      </div>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState>{t("No providers match these filters.")}</EmptyState>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
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
                {categoryName(p.category, locale)} · {p.remote ? t("Remote") : t("On site")}
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
