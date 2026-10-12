"use client";

import Link from "next/link";
import { useState } from "react";
import { Pill } from "@/components/ui";
import { RATES } from "@/lib/demo/app-fixtures";
import { DEMO_CITIES, pick, providers, type CityKey } from "@/lib/demo/fixtures";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { Avatar, Stars } from "../../demo-ui";

/** Provider list on the Services tab with a city chip row. Remote providers stay visible in every city. */
export function ServiceList({ locale }: { locale: Locale }) {
  const t = useT();
  const [city, setCity] = useState<CityKey | "">("phnom-penh");
  const list = providers.filter((p) => !city || p.cityKey === city || p.remote);
  const chip = (on: boolean) => `shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-brand-400 bg-brand-100 text-brand-900" : "border-stone-200 bg-white"}`;

  return (
    <>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t("City")}>
        <button type="button" onClick={() => setCity("")} aria-pressed={!city} className={chip(!city)}>{t("All cities")}</button>
        {DEMO_CITIES.filter((c) => c.key !== "other").map((c) => (
          <button key={c.key} type="button" onClick={() => setCity(c.key)} aria-pressed={city === c.key} className={chip(city === c.key)}>
            {pick(c.name, locale)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("Popular providers")}</h2>
        <Link href={`/demo/providers${city ? `?city=${city}` : ""}`} className="text-sm font-medium text-brand-800 underline">
          {t("See all")}
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {list.map((p) => {
          const name = pick(p.name, locale);
          return (
            <li key={p.slug} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <Avatar name={name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{pick(p.role, locale)}</p>
                <p className="truncate text-sm text-ink-muted">
                  {name} · {pick(p.district ?? p.city, locale)}
                  {p.remote ? ` · ${t("Remote")}` : ""}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                  <Stars rating={p.rating} />
                  <Pill tone="green">{t("Identity checked")}</Pill>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{pick(RATES[p.slug] ?? { en: "from $20", km: "ចាប់ពី $20" }, locale)}</p>
                <Link href={`/demo/providers/${p.slug}`} className="mt-1 inline-block rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-ink hover:bg-brand-400">
                  {t("Request a quote")}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
