import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { categoryLabel, getCategories } from "@/lib/categories";
import { getLocale, getT } from "@/lib/i18n/server";
import { NewJobForm } from "./new-job-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Post a job") };
}

export default async function NewJobPage({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const [t, locale, categories, { business }] = await Promise.all([getT(), getLocale(), getCategories(), searchParams]);
  const businessId = business && /^[0-9a-f-]{36}$/i.test(business) ? business : undefined;
  return (
    <main className="px-4 py-4">
      <PageTitle lead={t("Shift jobs (part-time, short-term) open after the legal review.")}>{t("Post a job")}</PageTitle>
      <NewJobForm businessId={businessId} categories={categories.map((c) => ({ value: String(c.id), label: categoryLabel(c, locale) }))} />
    </main>
  );
}
