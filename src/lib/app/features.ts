import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Feature switches (migration 0050). The owner sets each feature to off, only me, chosen people or everyone in
// Piron Work Space. The database answers per person; this file reads it once per request.
//
// To add a switch: insert a row into feature_flags (new migration), then wrap the feature with hasFeature(key)
// for links and requireFeature(key) at the top of its pages and server actions.

export type FeatureKey = "payments" | "home_pages";

export const getFeatures = cache(async (): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_features");
  if (error || !Array.isArray(data)) return [];
  return data as string[];
});

export async function hasFeature(key: FeatureKey): Promise<boolean> {
  return (await getFeatures()).includes(key);
}

/** Pages: show the normal not-found page when the feature is off for this person. */
export async function requireFeature(key: FeatureKey): Promise<void> {
  if (!(await hasFeature(key))) notFound();
}
