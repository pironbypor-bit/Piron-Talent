import { cache } from "react";
import { listProviders } from "@/lib/app/queries";
import { getCategories, type Category } from "@/lib/categories";
import { categoryContent, type CategoryContent } from "@/lib/category-pages";
import { cityFromSlug, type City } from "@/lib/cities";

export type CategoryPageData = {
  category: Category;
  content: CategoryContent;
  city: City | null;
  providers: Awaited<ReturnType<typeof listProviders>>;
  /** Cities that have at least one provider of this category, most providers first. */
  cities: { city: string; n: number }[];
};

/** Everything a category page needs, or null when the category or city is not one we publish. Once per request. */
export const loadCategoryPage = cache(async (categorySlug: string, citySlugOrNull?: string): Promise<CategoryPageData | null> => {
  const content = categoryContent(categorySlug);
  if (!content) return null;
  const category = (await getCategories()).find((c) => c.slug === categorySlug);
  if (!category) return null;
  let city: City | null = null;
  if (citySlugOrNull) {
    city = cityFromSlug(citySlugOrNull);
    if (!city) return null;
  }
  const [providers, all] = await Promise.all([
    listProviders({ categoryId: category.id, city: city ?? undefined, sort: "rated" }),
    city ? listProviders({ categoryId: category.id, sort: "rated" }) : null,
  ]);
  const source = all ?? providers;
  const counts = new Map<string, number>();
  for (const p of source) if (p.city && p.city !== "Other") counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
  const cities = [...counts.entries()].map(([c, n]) => ({ city: c, n })).sort((a, b) => b.n - a.n || a.city.localeCompare(b.city));
  return { category, content, city, providers, cities };
});
