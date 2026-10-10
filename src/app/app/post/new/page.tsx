import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getCategories } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { NewPostForm } from "./new-post-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Write a post@@title") };
}

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const [t, categories, { kind }] = await Promise.all([getT(), getCategories(), searchParams]);
  const initialKind = ["need_help", "offer_skill", "share_knowledge"].includes(kind ?? "") ? (kind as "need_help" | "offer_skill" | "share_knowledge") : "need_help";
  return (
    <main className="px-4 py-4">
      <PageTitle>{t("Write a post@@title")}</PageTitle>
      <NewPostForm categories={categories} initialKind={initialKind} />
    </main>
  );
}
