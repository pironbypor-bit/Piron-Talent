import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getCategories } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { ProviderForm } from "./provider-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Join as a provider") };
}

export default async function JoinPage() {
  const [t, categories] = await Promise.all([getT(), getCategories()]);
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <PageTitle lead={t("Tell us what you do. We contact selected providers for the first projects.")}>{t("Join as a provider")}</PageTitle>
      <ProviderForm categories={categories} />
    </main>
  );
}
