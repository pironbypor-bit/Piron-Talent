import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/category-page";
import { categoryLabel } from "@/lib/categories";
import { loadCategoryPage } from "@/lib/category-page-data";
import { getLocale, getT } from "@/lib/i18n/server";
import { shareMeta } from "@/lib/seo";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const [data, t, locale] = await Promise.all([loadCategoryPage(category), getT(), getLocale()]);
  if (!data) return { title: "Piron Work" };
  const name = categoryLabel(data.category, locale);
  return shareMeta({ title: t("{category} providers", { category: name }), description: t(data.content.lead), path: `/services/${data.category.slug}` });
}

export default async function ServiceCategoryPage({ params }: Props) {
  const { category } = await params;
  const [data, t, locale] = await Promise.all([loadCategoryPage(category), getT(), getLocale()]);
  if (!data) notFound();
  return <CategoryPage data={data} t={t} locale={locale} />;
}
