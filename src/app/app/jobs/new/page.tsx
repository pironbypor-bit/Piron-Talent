import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { NewJobForm } from "./new-job-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Post a job") };
}

export default async function NewJobPage() {
  const t = await getT();
  return (
    <main className="px-4 py-4">
      <PageTitle lead={t("Shift jobs (part-time, short-term) open after the legal review.")}>{t("Post a job")}</PageTitle>
      <NewJobForm />
    </main>
  );
}
