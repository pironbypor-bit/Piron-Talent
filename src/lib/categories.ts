import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/category-label";

export { categoryLabel, type Category } from "@/lib/category-label";

/** Active categories, once per request. Readable by anyone (landing page and both forms). */
export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id,slug,name,name_km").eq("active", true).order("id");
  return (data ?? []) as Category[];
});
