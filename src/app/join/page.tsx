import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getCategories } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { ProviderForm } from "./provider-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Join as a provider") };
}

type Props = { searchParams: Promise<{ category?: string; source?: string }> };
const SOURCE = /^[a-z0-9-]{1,40}$/;

export default async function JoinPage({ searchParams }: Props) {
  const [t, categories, { category, source }] = await Promise.all([getT(), getCategories(), searchParams]);
  const initial = { category_id: /^[0-9]+$/.test(category ?? "") ? category! : "", source: SOURCE.test(source ?? "") ? source! : "" };
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <PageTitle lead={t("Tell us what you do. We contact selected providers for the first projects.")}>{t("Join as a provider")}</PageTitle>
      <ProviderForm categories={categories} initial={initial} />
    </main>
  );
}
