import type { MetadataRoute } from "next";
import { CITIES, citySlug } from "@/lib/cities";
import { CATEGORY_CONTENT } from "@/lib/category-pages";
import { SEGMENTS } from "@/lib/segments";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Home, segment pages, the directory per city, and every available provider. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id,updated_at,city,primary_category_id").eq("is_available", true).limit(5000);
  const { data: companyIds } = await supabase.rpc("public_company_ids");
  const { data: cats } = await supabase.from("categories").select("id,slug").eq("active", true);
  const slugById = new Map(((cats ?? []) as { id: number; slug: string }[]).map((c) => [c.id, c.slug]));
  // A category-in-city page is listed only when at least one available provider is based there; empty ones stay out of search.
  const combos = new Set<string>();
  for (const p of (data ?? []) as { city: string | null; primary_category_id: number | null }[]) {
    const slug = p.primary_category_id ? slugById.get(p.primary_category_id) : null;
    if (slug && p.city && p.city !== "Other") combos.add(slug + "/" + citySlug(p.city));
  }
  const now = new Date();
  return [
    ...SEGMENTS.map((s) => ({ url: `${SITE_URL}/for/${s.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${SITE_URL}/providers`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 },
    ...CATEGORY_CONTENT.map((c) => ({ url: `${SITE_URL}/services/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...((companyIds ?? []) as string[]).map((id) => ({ url: `${SITE_URL}/companies/${id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...[...combos].map((k) => ({ url: `${SITE_URL}/services/${k}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...CITIES.filter((c) => c !== "Other").map((c) => ({ url: `${SITE_URL}/providers?city=${encodeURIComponent(c)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...((data ?? []) as { id: string; updated_at: string | null }[]).map((p) => ({ url: `${SITE_URL}/providers/${p.id}`, lastModified: p.updated_at ? new Date(p.updated_at) : now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
