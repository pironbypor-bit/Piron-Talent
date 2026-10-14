import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/cities";
import { SEGMENTS } from "@/lib/segments";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Home, segment pages, the directory per city, and every available provider. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id,updated_at").eq("is_available", true).limit(5000);
  const now = new Date();
  return [
    ...SEGMENTS.map((s) => ({ url: `${SITE_URL}/for/${s.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${SITE_URL}/providers`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...CITIES.filter((c) => c !== "Other").map((c) => ({ url: `${SITE_URL}/providers?city=${encodeURIComponent(c)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...((data ?? []) as { id: string; updated_at: string | null }[]).map((p) => ({ url: `${SITE_URL}/providers/${p.id}`, lastModified: p.updated_at ? new Date(p.updated_at) : now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
