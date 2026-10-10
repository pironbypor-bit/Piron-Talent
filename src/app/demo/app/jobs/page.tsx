import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { JobsList } from "./jobs-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Jobs & Shifts") };
}

export default async function AppJobs() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="px-4 py-4">
      <h1 className="text-xl font-bold">{t("Jobs & Shifts")}</h1>
      <p className="text-sm text-ink-muted">{t("Flexible work, real pay. Shift jobs open after the legal review.")}</p>
      <JobsList locale={locale} />
    </main>
  );
}
