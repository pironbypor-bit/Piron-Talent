import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getLocale, getT } from "@/lib/i18n/server";
import { NewProjectForm } from "./new-project-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("New project") };
}

export default async function DemoNewProjectPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <PageTitle lead={t("Describe one project clearly and providers can quote without back-and-forth.")}>{t("New project")}</PageTitle>
      <NewProjectForm locale={locale} />
    </main>
  );
}
