import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getLocale, getT } from "@/lib/i18n/server";
import { DashboardView } from "./dashboard-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Dashboard") };
}

export default async function DemoDashboardPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageTitle lead={t("Signed in as {email}", { email: "sophea@example.com" })}>{t("Dashboard")}</PageTitle>
      <DashboardView locale={locale} />
    </main>
  );
}
