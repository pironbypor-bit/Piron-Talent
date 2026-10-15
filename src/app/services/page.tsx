import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, categoryLabel } from "@/lib/categories";
import { CATEGORY_CONTENT } from "@/lib/category-pages";
import { getLocale, getT } from "@/lib/i18n/server";
import { shareMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return shareMeta({ title: t("Services"), description: t("Find skilled people in Cambodia for finance, documents, design, IT, repairs, lessons and more."), path: "/services" });
}

/** Public index of the service categories; each links to its own page. */
export default async function ServicesIndexPage() {
  const [t, locale, categories] = await Promise.all([getT(), getLocale(), getCategories()]);
  const items = CATEGORY_CONTENT.map((c) => ({ c, cat: categories.find((x) => x.slug === c.slug) })).filter((x) => x.cat);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{t("Services")}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-muted">{t("Find skilled people in Cambodia for finance, documents, design, IT, repairs, lessons and more.")}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {items.map(({ c, cat }) => (
          <li key={c.slug}>
            <Link href={`/services/${c.slug}`} className="block h-full rounded-2xl border border-stone-200 p-4 hover:bg-brand-50">
              <span className="block font-semibold">{categoryLabel(cat!, locale)}</span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-muted">{t(c.lead)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
