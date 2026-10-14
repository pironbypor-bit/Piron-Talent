import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Building2, ChevronRight, Plus, Search, Store } from "lucide-react";
import { AngkorSilhouette } from "@/components/brand";
import { CheckedPill, Pill } from "@/components/ui";
import { setAvailableThisWeek } from "@/lib/app/actions";
import { getMe, myBusinesses, myCounters, myIdentityStatus } from "@/lib/app/queries";
import { isAvailableNow } from "@/components/signals";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../avatar";
import { AvatarUpload } from "./uploads";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Profile") };
}

// Profile design A (owner decision 2026-10-14): the front page is a hub with one card per hat: I need work done,
// I offer a service, My companies, Looking for work. Notifications and Settings live in the top-bar menu.

const card = "card mt-3 overflow-hidden";
const head = "flex items-center gap-3 px-4 pt-3";
const icon = "flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800";
const row = "flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold hover:bg-brand-50";
const chipPrimary = "rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-ink hover:bg-brand-400";
const chipSecondary = "rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold hover:bg-brand-50";

export default async function ProfilePage() {
  const [t, locale, me, counters, identity, companies] = await Promise.all([getT(), getLocale(), getMe(), myCounters(), myIdentityStatus(), myBusinesses()]);
  if (!me) return null; // the proxy redirects anonymous visitors to /login
  const on = isAvailableNow(me);

  return (
    <main className="px-4 pb-24 pt-4">
      <div className="hero-amber relative overflow-hidden rounded-3xl p-4">
        <AngkorSilhouette className="pointer-events-none absolute bottom-0 right-0 h-16 w-56 text-brand-600/25" />
        <div className="relative flex items-center gap-3">
          <AvatarImg name={me.display_name} url={me.avatar_url} size={14} />
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">{me.display_name}</h1>
            <p className="truncate text-sm text-brand-900">{[me.role_line, me.city ? t(me.city) : null].filter(Boolean).join(" · ") || t("Build your record, one job at a time.")}</p>
            {me.identity_checked && <span className="mt-1 inline-block"><CheckedPill>{t("Identity checked")}</CheckedPill></span>}
          </div>
        </div>
      </div>

      {/* 1. Customer */}
      <section className={card}>
        <div className={head}>
          <span className={icon}><Search className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("I need work done")}</p>
            <p className="text-sm text-ink-muted">{t("{n} open requests", { n: counters.posts })} · {t("{n} saved providers", { n: counters.savedProviders })}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-2 px-4">
          <Link href="/app/services" className={chipPrimary}>{t("Find a service")}</Link>
          <Link href="/app/post/new" className={chipSecondary}>{t("Post a project")}</Link>
        </div>
        <Link href="/app/profile/jobs" className={`${row} mt-1`}>{t("My jobs and requests")} <ChevronRight className="size-4 text-ink-muted" /></Link>
      </section>

      {/* 2. Provider */}
      <section className={card}>
        <div className={head}>
          <span className={icon}><Store className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("I offer a service")}</p>
            <p className="text-sm text-ink-muted">{me.is_available ? `${me.role_line ?? t("Provider")} · ${t("{n} completed jobs", { n: me.completed_jobs })}` : t("Turn it on in Edit profile to appear in Services.")}</p>
          </div>
          {me.is_available && <Pill tone="green">{t("Visible")}</Pill>}
        </div>
        {me.is_available && (
          <div className="mt-2 flex items-center gap-3 px-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t("Available this week")}</p>
              <p className="text-xs text-ink-muted">{on ? t("Shown on your card until {date}", { date: formatDate(me.available_until!, locale) }) : t("Tell customers you have time for new work. Lasts 7 days.")}</p>
            </div>
            <form action={setAvailableThisWeek}>
              <input type="hidden" name="on" value={on ? "0" : "1"} />
              <button type="submit" role="switch" aria-checked={on} aria-label={t("Available this week")} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald-500" : "bg-stone-300"}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </form>
          </div>
        )}
        <Link href="/app/profile/edit" className={`${row} mt-1`}>{me.is_available ? t("My service") : t("Set up my service")} <ChevronRight className="size-4 text-ink-muted" /></Link>
      </section>

      {/* 3. Companies */}
      <section className={card}>
        <div className={head}>
          <span className={icon}><Building2 className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("My companies")}</p>
            <p className="text-sm text-ink-muted">{t("Hire part-time staff or freelancers under a company name.")}</p>
          </div>
        </div>
        <ul className="mt-2 divide-y divide-stone-100 border-t border-stone-100">
          {companies.map((c) => (
            <li key={c.id}>
              <Link href={`/app/profile/companies/${c.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{c.name}</span>
                  <span className="block text-xs text-ink-muted">{c.jobs} {t("part-time")} · {c.projects} {t("projects")}{c.city ? ` · ${t(c.city)}` : ""}</span>
                </span>
                <ChevronRight className="size-4 text-ink-muted" />
              </Link>
            </li>
          ))}
          <li>
            <Link href="/app/profile/companies/new" className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"><Plus className="size-4" /> {t("Add company")}</Link>
          </li>
        </ul>
      </section>

      {/* 4. Worker */}
      <section className={card}>
        <div className={head}>
          <span className={icon}><Briefcase className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("Looking for work")}</p>
            <p className="text-sm text-ink-muted">{t("{n} applications", { n: counters.applications })} · {t("{n} saved posts", { n: counters.savedPosts })}</p>
          </div>
        </div>
        <Link href="/app/jobs" className={`${row} mt-1`}>{t("Browse jobs")} <ChevronRight className="size-4 text-ink-muted" /></Link>
        <Link href="/app/activities" className={row}>{t("Volunteer activities")} <ChevronRight className="size-4 text-ink-muted" /></Link>
      </section>

      <section className="card mt-3 p-4" id="identity">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{t("Identity check")}</p>
            <p className="text-sm text-ink-muted">{identity === "none" ? t("Not started") : identity === "pending" ? t("Pending") : identity === "checked" ? t("Checked") : t("Rejected")}</p>
          </div>
          {identity === "pending" && <Pill tone="amber">{t("Pending")}</Pill>}
          {identity === "checked" && <Pill tone="green">{t("Checked")}</Pill>}
          {(identity === "none" || identity === "rejected") && (
            <Link href="/app/profile/identity" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-400">{identity === "rejected" ? t("Try again") : t("Start")}</Link>
          )}
        </div>
      </section>

      <section className="card mt-3 p-4">
        <p className="font-semibold">{t("Avatar")}</p>
        <AvatarUpload userId={me.id} />
      </section>
    </main>
  );
}
