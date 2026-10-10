import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getCategories } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { NewPostForm } from "./new-post-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Write a post@@title") };
}

export default async function NewPostPage() {
  const [t, categories] = await Promise.all([getT(), getCategories()]);
  return (
    <main className="px-4 py-4">
      <PageTitle>{t("Write a post@@title")}</PageTitle>
      <NewPostForm categories={categories} />
    </main>
  );
}
