import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Plus, Users } from "lucide-react";
import { Button, CheckedPill, EmptyState, Pill, inputClass } from "@/components/ui";
import { listActivities } from "@/lib/app/queries";
import { CITIES, isCity } from "@/lib/cities";
import { formatRange } from "@/lib/datetime";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Volunteer activities") };
}

/** Upcoming volunteer activities, soonest first, optionally for one province. */
export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const [t, locale, { city }] = await Promise.all([getT(), getLocale(), searchParams]);
  const province = isCity(city) ? city : "";
  const activities = await listActivities(province || undefined);

  return (
    <main className="px-4 pb-24 pt-4">
      <section className="hero-amber rounded-3xl p-4">
        <h1 className="text-xl font-bold">{t("Volunteer activities")}</h1>
        <p className="text-sm text-brand-900">{t("Give a few hours, meet people, build a record.")}</p>
        <Link href="/app/activities/new" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold hover:bg-brand-50"><Plus className="size-4" />{t("Organise an activity")}</Link>
      </section>

      <form action="/app/activities" method="get" className="mt-3 flex gap-2">
        <select name="city" defaultValue={province} className={`${inputClass} min-w-0 flex-1`} aria-label={t("Province or city")}>
          <option value="">{t("All provinces and cities")}</option>
          {CITIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
        </select>
        <Button type="submit" variant="secondary" className="px-4 py-2 text-sm">{t("Show")}</Button>
      </form>

      {activities.length === 0 ? (
        <div className="mt-6"><EmptyState>{t("No activities coming up.")}</EmptyState></div>
      ) : (
        <ul className="mt-4 space-y-2">
          {activities.map((a) => {
            const full = a.joined >= a.capacity;
            return (
              <li key={a.id}>
                <Link href={`/app/activities/${a.id}`} className="card block p-3 hover:bg-brand-50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 font-semibold">{a.title}</p>
                    {a.mine === "joined" || a.mine === "confirmed" ? <Pill tone="green">{t("You are in")}</Pill> : a.mine === "waitlist" ? <Pill tone="amber">{t("Waitlist")}</Pill> : full ? <Pill>{t("Full")}</Pill> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">{formatRange(a.starts_at, a.ends_at, locale)}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted"><MapPin className="size-3.5" />{[a.place, a.city ? t(a.city) : null].filter(Boolean).join(" · ") || "-"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span>{a.organiser.display_name}</span>
                    {a.organiser.identity_checked && <CheckedPill>{t("Identity checked")}</CheckedPill>}
                    <span className="ml-auto inline-flex items-center gap-1 text-ink-muted"><Users className="size-3.5" />{a.joined}/{a.capacity}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
