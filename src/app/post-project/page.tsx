import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getCategories } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { ProjectForm } from "./project-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Post a project") };
}

export default async function PostProjectPage() {
  const [t, categories] = await Promise.all([getT(), getCategories()]);
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <PageTitle lead={t("We reply within one working day by phone or Telegram.")}>{t("Tell us about your project")}</PageTitle>
      <ProjectForm categories={categories} />
    </main>
  );
}
