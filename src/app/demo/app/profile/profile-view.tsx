"use client";

import Link from "next/link";
import { Bell, FileCheck, MessageCircle, Settings, Sparkles, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button, Notice, Pill } from "@/components/ui";
import { notifications } from "@/lib/demo/app-fixtures";
import { pick, projectById, providerBySlug } from "@/lib/demo/fixtures";
import { useDemoJobs } from "@/lib/demo/state";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";

const ICONS: Record<string, LucideIcon> = { quote: FileCheck, view: Sparkles, message: MessageCircle, match: Bell };

/** Profile tab: greeting, counters, identity check, example business model, notifications. Counters read this tab's demo state. */
export function ProfileView({ locale }: { locale: Locale }) {
  const t = useT();
  const jobs = useDemoJobs();
  const [tab, setTab] = useState<"overview" | "saved" | "applications">("overview");
  const [identity, setIdentity] = useState(false);
  const entries = Object.entries(jobs);
  const active = entries.filter(([, j]) => j.step === "accepted" || j.step === "delivered").length;
  const when = (d: number) => (d === 0 ? t("Today@@time") : d === 1 ? t("Yesterday") : t("{n} days ago", { n: d }));

  const counters: [string, number][] = [
    [t("Saved posts"), 12],
    [t("Quote requests"), 1 + entries.length],
    [t("My applications"), 2],
    [t("Active jobs"), active],
  ];

  return (
    <div>
      <div className="flex items-start justify-between gap-3 rounded-3xl bg-brand-100 p-4">
        <div>
          <h1 className="text-xl font-bold">{t("Hello, {name}!", { name: "Sophea" })}</h1>
          <p className="text-sm text-brand-900">{t("Build your record, one job at a time.")}</p>
          <p className="mt-1 text-xs text-ink-muted">{t("Customer and provider")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={t("Settings")} className="rounded-full bg-white p-2 text-ink-muted hover:text-ink">
            <Settings className="size-4" />
          </button>
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-500 font-bold text-ink">S</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {(["overview", "saved", "applications"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${tab === k ? "border-ink bg-ink text-white" : "border-stone-300 bg-white"}`}>
            {k === "overview" ? t("Overview") : k === "saved" ? t("Saved") : t("Applications")}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <ul className="mt-4 grid grid-cols-4 gap-2">
            {counters.map(([label, n]) => (
              <li key={label} className="rounded-2xl bg-white p-2 text-center shadow-sm">
                <p className="text-xl font-bold">{n}</p>
                <p className="text-[11px] leading-tight text-ink-muted">{label}</p>
              </li>
            ))}
          </ul>

          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{t("Identity check")}</p>
                <p className="text-sm text-ink-muted">{identity ? t("Pending") : t("Not started")}</p>
              </div>
              {identity ? (
                <Pill tone="amber">{t("Pending")}</Pill>
              ) : (
                <Button type="button" className="px-3 py-1.5 text-sm" onClick={() => setIdentity(true)}>
                  {t("Start")}
                </Button>
              )}
            </div>
            {identity && (
              <div className="mt-3">
                <Notice tone="info">{t("In the live product you upload an ID photo to a private folder; a person checks it within two working days.")}</Notice>
              </div>
            )}
          </section>

          <section className="mt-4">
            <h2 className="font-semibold">{t("Business model")}</h2>
            <p className="text-xs text-ink-muted">{t("Example. Final numbers after the pilot.")}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="text-2xl font-bold text-brand-800">6-10%</p>
                <p className="text-xs font-medium">{t("Service fee")}</p>
                <p className="text-[11px] text-ink-muted">{t("of completed paid work")}</p>
              </div>
              <div className="rounded-2xl bg-brand-50 p-3">
                <p className="text-2xl font-bold text-brand-800">$19+</p>
                <p className="text-xs font-medium">{t("Business plan")}</p>
                <p className="text-[11px] text-ink-muted">{t("per month, for companies")}</p>
              </div>
            </div>
          </section>

          <section className="mt-4" id="notifications">
            <h2 className="font-semibold">{t("Notifications")}</h2>
            <ul className="mt-2 divide-y divide-stone-200 rounded-2xl bg-white shadow-sm">
              {notifications.map((n, i) => {
                const Icon = ICONS[n.icon];
                return (
                  <li key={i} className="flex items-start gap-3 px-3 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{pick(n.title, locale)}</p>
                      <p className="truncate text-sm text-ink-muted">{pick(n.body, locale)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-muted">{when(n.daysAgo)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {tab === "saved" && (
        <ul className="mt-4 space-y-2">
          {["dara-vann", "sokha-lim"].map((slug) => {
            const p = providerBySlug(slug)!;
            return (
              <li key={slug} className="rounded-2xl bg-white p-3 shadow-sm">
                <Link href={`/demo/providers/${slug}`} className="font-semibold hover:underline">
                  {pick(p.name, locale)}
                </Link>
                <p className="text-sm text-ink-muted">{pick(p.role, locale)}</p>
              </li>
            );
          })}
        </ul>
      )}

      {tab === "applications" && (
        <ul className="mt-4 space-y-2">
          {entries.length === 0 && <li className="rounded-2xl bg-white p-3 text-sm text-ink-muted shadow-sm">{t("Nothing yet.")}</li>}
          {entries.map(([id, job]) => {
            const project = projectById(id);
            if (!project) return null;
            const done = job.step === "confirmed" || job.step === "reviewed";
            return (
              <li key={id} className="rounded-2xl bg-white p-3 shadow-sm">
                <Link href={`/demo/jobs/${id}`} className="font-semibold hover:underline">
                  {pick(project.title, locale)}
                </Link>
                <p className="text-sm text-ink-muted">
                  ${job.price} · {done ? t("Completed") : t("In progress")}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-center">
        <Link href="/" className="text-sm text-ink-muted underline">
          {t("Back to site")}
        </Link>
      </p>
    </div>
  );
}
