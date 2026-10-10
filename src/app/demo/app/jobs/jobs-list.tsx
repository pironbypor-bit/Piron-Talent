"use client";

import { Bookmark, Search } from "lucide-react";
import { useState } from "react";
import { Notice, Pill } from "@/components/ui";
import { JOB_TYPE_LABEL, jobs, type JobType } from "@/lib/demo/app-fixtures";
import { pick } from "@/lib/demo/fixtures";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";

const FILTERS: (JobType | "all")[] = ["all", "part_time", "short_term", "freelance"];

/** Jobs tab: filters, job cards, Apply kept in this tab only. Shift jobs are shown as a preview. */
export function JobsList({ locale }: { locale: Locale }) {
  const t = useT();
  const [filter, setFilter] = useState<JobType | "all">("all");
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const [kept, setKept] = useState<Record<string, boolean>>({});
  const list = jobs.filter((j) => filter === "all" || j.type === filter);

  return (
    <div>
      <label className="mt-3 flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-ink-muted">
        <Search className="size-4" aria-hidden="true" />
        <input className="w-full bg-transparent outline-none placeholder:text-stone-400" placeholder={t("Search jobs")} aria-label={t("Search jobs")} />
      </label>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${filter === f ? "border-ink bg-ink text-white" : "border-stone-300 bg-white hover:bg-stone-50"}`}
          >
            {f === "all" ? t("All posts") : t(JOB_TYPE_LABEL[f])}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {list.map((j) => (
          <li key={j.id} className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex gap-3">
              <span className={`size-14 shrink-0 rounded-xl ${j.tone}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-snug">{pick(j.title, locale)}</p>
                  <button type="button" aria-pressed={!!kept[j.id]} aria-label={t("Keep")} onClick={() => setKept({ ...kept, [j.id]: !kept[j.id] })} className="shrink-0 text-ink-muted hover:text-ink">
                    <Bookmark className={`size-5 ${kept[j.id] ? "fill-brand-500 text-brand-600" : ""}`} />
                  </button>
                </div>
                <p className="text-sm text-ink-muted">{pick(j.company, locale)}</p>
                <p className="text-xs text-ink-muted">{pick(j.place, locale)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <Pill tone={j.type === "part_time" || j.type === "short_term" ? "amber" : "neutral"}>{t(JOB_TYPE_LABEL[j.type])}</Pill>
                <span>{pick(j.when, locale)}</span>
              </div>
              <p className="text-base font-bold">
                {j.pay} <span className="text-xs font-normal text-ink-muted">{t(j.payUnit)}</span>
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              {(j.type === "part_time" || j.type === "short_term") && <span className="text-xs text-ink-muted">{t("Preview")} · {t("After review")}</span>}
              <button
                type="button"
                onClick={() => setApplied({ ...applied, [j.id]: true })}
                disabled={!!applied[j.id]}
                className={`ml-auto rounded-full px-4 py-1.5 text-sm font-semibold ${applied[j.id] ? "bg-green-100 text-green-800" : "bg-brand-500 text-ink hover:bg-brand-400"}`}
              >
                {applied[j.id] ? t("Applied") : t("Apply")}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {Object.keys(applied).length > 0 && (
        <div className="mt-4">
          <Notice tone="info">{t("In the live product the employer sees your profile and completed jobs, and replies here.")}</Notice>
        </div>
      )}
    </div>
  );
}
