import type { Locale } from "@/lib/i18n/core";

export type Category = { id: number; slug: string; name: string; name_km: string | null };

/** Khmer name first when the page is in Khmer; the English name is the fallback. Safe in client components. */
export const categoryLabel = (c: Pick<Category, "name" | "name_km">, locale: Locale) =>
  locale === "km" && c.name_km ? c.name_km : c.name;
