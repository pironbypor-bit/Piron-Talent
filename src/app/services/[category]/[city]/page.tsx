import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/category-page";
import { categoryLabel } from "@/lib/categories";
import { loadCategoryPage } from "@/lib/category-page-data";
import { citySlug } from "@/lib/cities";
import { getLocale, getT } from "@/lib/i18n/server";
import { shareMeta } from "@/lib/seo";

type Props = { params: Promise<{ category: string; city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, city } = await params;
  const [data, t, locale] = await Promise.all([loadCategoryPage(category, city), getT(), getLocale()]);
  if (!data || !data.city) return { title: "Piron Work" };
  const name = categoryLabel(data.category, locale);
  const meta = shareMeta({ title: t("{category} providers in {city}", { category: name, city: t(data.city) }), description: t(data.content.lead), path: `/services/${data.category.slug}/${citySlug(data.city)}` });
  // A page with no providers is thin: keep it out of search results until someone has joined.
  return data.providers.length === 0 ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function ServiceCityPage({ params }: Props) {
  const { category, city } = await params;
  const [data, t, locale] = await Promise.all([loadCategoryPage(category, city), getT(), getLocale()]);
  if (!data) notFound();
  return <CategoryPage data={data} t={t} locale={locale} />;
}
