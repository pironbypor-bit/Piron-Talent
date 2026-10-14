import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { NewJobForm } from "./new-job-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Post a job") };
}

export default async function NewJobPage({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const [t, { business }] = await Promise.all([getT(), searchParams]);
  const businessId = business && /^[0-9a-f-]{36}$/i.test(business) ? business : undefined;
  return (
    <main className="px-4 py-4">
      <PageTitle lead={t("Shift jobs (part-time, short-term) open after the legal review.")}>{t("Post a job")}</PageTitle>
      <NewJobForm businessId={businessId} />
    </main>
  );
}
