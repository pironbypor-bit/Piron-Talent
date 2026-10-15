import type { Metadata } from "next";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { Button, EmptyState, Field, Notice } from "@/components/ui";
import { addJobAlert, removeJobAlert } from "@/lib/app/actions";
import { getMe, myJobAlerts } from "@/lib/app/queries";
import { categoryLabel, getCategories } from "@/lib/categories";
import { CITIES } from "@/lib/cities";
import { getLocale, getT } from "@/lib/i18n/server";
import { Dropdown } from "@/components/dropdown";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Job alerts") };
}

/** Up to five alerts: a category, a province or both. A matching new job or open project sends one notification. */
export default async function JobAlertsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [t, locale, me, alerts, categories, { error }] = await Promise.all([getT(), getLocale(), getMe(), myJobAlerts(), getCategories(), searchParams]);
  if (!me) return null;
  const nameOf = (id: number | null) => {
    const c = categories.find((x) => x.id === id);
    return c ? categoryLabel(c, locale) : null;
  };

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/jobs" className="text-sm font-medium underline">{t("Back")}</Link>
      <h1 className="mt-3 text-2xl font-bold">{t("Job alerts")}</h1>
      <p className="text-sm text-ink-muted">{t("Get a notification when a new job or open project matches. At most five a day.")}</p>
      {error === "limit" && <div className="mt-3"><Notice tone="error">{t("You can keep up to five alerts. Remove one first.")}</Notice></div>}
      {error === "1" && <div className="mt-3"><Notice tone="error">{t("Choose a category, a province, or both.")}</Notice></div>}

      {alerts.length === 0 ? (
        <div className="mt-4"><EmptyState illustration={<Bell className="mx-auto size-10 text-brand-400" />}>{t("No alerts yet.")}</EmptyState></div>
      ) : (
        <ul className="card mt-4 divide-y divide-stone-100">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <Bell className="size-4 text-brand-700" />
              <span className="min-w-0 flex-1 truncate font-medium">{[nameOf(a.category_id), a.city ? t(a.city) : null].filter(Boolean).join(" · ")}</span>
              <form action={removeJobAlert.bind(null, a.id)}>
                <button type="submit" aria-label={t("Remove")} className="rounded-full p-1.5 text-ink-muted hover:bg-stone-100"><X className="size-4" /></button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {alerts.length < 5 && (
        <form action={addJobAlert} className="card mt-4 space-y-3 p-4">
          <p className="font-semibold">{t("New alert")}</p>
          <Field label={t("Category")}>
            <Dropdown name="category" defaultValue="" options={[{ value: "", label: t("All categories") }, ...categories.map((c) => ({ value: String(c.id), label: categoryLabel(c, locale) }))]} />
          </Field>
          <Field label={t("Province or city")}>
            <Dropdown name="city" defaultValue="" options={[{ value: "", label: t("All provinces and cities") }, ...CITIES.map((c) => ({ value: c, label: t(c) }))]} />
          </Field>
          <Button type="submit">{t("Add alert")}</Button>
        </form>
      )}
    </main>
  );
}
