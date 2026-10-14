import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Bookmark, Briefcase, FileText, Settings, Users, type LucideIcon } from "lucide-react";
import { AngkorSilhouette } from "@/components/brand";
import { CheckedPill, Pill } from "@/components/ui";
import { setAvailableThisWeek } from "@/lib/app/actions";
import { countUnread, getMe, myCounters, myIdentityStatus } from "@/lib/app/queries";
import { isAvailableNow } from "@/components/signals";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../avatar";
import { AvatarUpload } from "./uploads";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Profile") };
}

export default async function ProfilePage() {
  const [t, locale, me, counters, identity, unread] = await Promise.all([getT(), getLocale(), getMe(), myCounters(), myIdentityStatus(), countUnread()]);
  if (!me) return null; // the proxy redirects anonymous visitors to /login

  return (
    <main className="px-4 pb-24 pt-4">
      <div className="hero-amber relative overflow-hidden rounded-3xl p-4">
        <AngkorSilhouette className="pointer-events-none absolute bottom-0 right-0 h-16 w-56 text-brand-600/25" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <AvatarImg name={me.display_name} url={me.avatar_url} size={14} />
            <div>
              <h1 className="text-xl font-bold leading-tight">{t("Hello, {name}!", { name: me.display_name })}</h1>
              <p className="text-sm text-brand-900">{me.role_line ?? t("Build your record, one job at a time.")}</p>
              {me.identity_checked && <span className="mt-1 inline-block"><CheckedPill>{t("Identity checked")}</CheckedPill></span>}
            </div>
          </div>
          <Link href="/app/settings" aria-label={t("Settings")} className="rounded-full bg-white/90 p-2 text-ink-muted hover:text-ink">
            <Settings className="size-4" />
          </Link>
        </div>
      </div>

      {(() => {
        const checks: [string, boolean][] = [
          [t("Add a photo"), !!me.avatar_url],
          [t("Add a role line"), !!me.role_line],
          [t("Write about yourself"), !!me.bio],
          [t("Add your city"), !!me.city],
          [t("Add skills"), me.skills.length > 0],
          [t("Choose a main category"), !!me.primary_category_id],
          [t("Identity check"), me.identity_checked],
        ];
        const done = checks.filter(([, ok]) => ok).length;
        const next = checks.find(([, ok]) => !ok);
        return (
          <section className="card mt-4 p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">{t("Profile strength")}</p>
              <p className="text-sm text-ink-muted">{t("{n} of {total} complete", { n: done, total: checks.length })}</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round((done / checks.length) * 100)}%` }} />
            </div>
            {next && (
              <Link href={next[0] === t("Identity check") ? "/app/profile#identity" : "/app/profile/edit"} className="mt-2 inline-block text-sm font-medium text-brand-800 underline">
                {next[0]}
              </Link>
            )}
          </section>
        );
      })()}

      <ul className="mt-4 grid grid-cols-4 gap-2">
        {([[t("Saved posts"), counters.savedPosts, Bookmark], [t("Saved providers"), counters.savedProviders, Users], [t("My applications"), counters.applications, FileText], [t("Projects"), counters.posts, Briefcase]] as [string, number, LucideIcon][]).map(([label, n, Icon]) => (
          <li key={label} className="card flex flex-col items-center p-2 text-center">
            <span className="flex size-8 items-center justify-center rounded-xl bg-brand-100 text-brand-800"><Icon className="size-4" /></span>
            <p className="mt-1 text-xl font-bold">{n}</p>
            <p className="text-[11px] leading-tight text-ink-muted">{label}</p>
          </li>
        ))}
      </ul>

      {me.is_available && (() => {
        const on = isAvailableNow(me);
        return (
          <section className="card mt-4 flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t("Available this week")}</p>
              <p className="text-sm text-ink-muted">{on ? t("Shown on your card until {date}", { date: formatDate(me.available_until!, locale) }) : t("Tell customers you have time for new work. Lasts 7 days.")}</p>
            </div>
            <form action={setAvailableThisWeek}>
              <input type="hidden" name="on" value={on ? "0" : "1"} />
              <button type="submit" role="switch" aria-checked={on} aria-label={t("Available this week")} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald-500" : "bg-stone-300"}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </form>
          </section>
        );
      })()}

      <Link href="/app/profile/jobs" className="card mt-4 flex items-center justify-between px-4 py-3 font-semibold hover:bg-brand-50">
        {t("My jobs")}
        <span className="text-ink-muted">›</span>
      </Link>

      <section className="mt-4 card p-4" id="identity">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{t("Identity check")}</p>
            <p className="text-sm text-ink-muted">{identity === "none" ? t("Not started") : identity === "pending" ? t("Pending") : identity === "checked" ? t("Checked") : t("Rejected")}</p>
          </div>
          {identity === "pending" && <Pill tone="amber">{t("Pending")}</Pill>}
          {identity === "checked" && <Pill tone="green">{t("Checked")}</Pill>}
        </div>
        {(identity === "none" || identity === "rejected") && (
          <Link href="/app/profile/identity" className="mt-3 inline-block rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-400">
            {identity === "rejected" ? t("Try again") : t("Start")}
          </Link>
        )}
      </section>

      <section className="mt-4 card p-4">
        <p className="font-semibold">{t("Avatar")}</p>
        <AvatarUpload userId={me.id} />
      </section>

      <Link href="/app/notifications" className="card mt-4 flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800"><Bell className="size-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("Notifications")}</span>
          <span className="block text-sm text-ink-muted">{unread > 0 ? t("{n} unread", { n: unread }) : t("All caught up.")}</span>
        </span>
        {unread > 0 && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-ink">{unread}</span>}
      </Link>

    </main>
  );
}
