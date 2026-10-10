import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getCategories } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { ProjectForm } from "./project-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Post a project") };
}

type Props = { searchParams: Promise<{ details?: string; category?: string; source?: string }> };
const SOURCE = /^[a-z0-9-]{1,40}$/;

export default async function PostProjectPage({ searchParams }: Props) {
  const [t, categories, { details, category, source }] = await Promise.all([getT(), getCategories(), searchParams]);
  const initial = { details: (details ?? "").slice(0, 3000), category_id: /^[0-9]+$/.test(category ?? "") ? category! : "", source: SOURCE.test(source ?? "") ? source! : "" };
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <PageTitle lead={t("We reply within one working day by phone or Telegram.")}>{t("Tell us about your project")}</PageTitle>
      <ProjectForm categories={categories} initial={initial} />
    </main>
  );
}
