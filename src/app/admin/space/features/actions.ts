"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MODES = ["off", "owner", "people", "everyone"];
const uuid = /^[0-9a-f-]{36}$/i;
const key = /^[a-z0-9_]{2,40}$/;

function done(error: boolean): never {
  revalidatePath("/admin/space/features");
  revalidatePath("/app", "layout");
  redirect(`/admin/space/features${error ? "?error=1" : ""}`);
}

/** Set a feature to off, only me, chosen people or everyone. The database checks the owner and writes the change log. */
export async function setFeatureMode(formData: FormData) {
  const k = String(formData.get("key") ?? "");
  const mode = String(formData.get("mode") ?? "");
  if (!key.test(k) || !MODES.includes(mode)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("space_set_feature", { p_key: k, p_mode: mode });
  done(!!error);
}

/** Add or remove one person from a feature that is set to chosen people. */
export async function setFeaturePerson(formData: FormData) {
  const k = String(formData.get("key") ?? "");
  const user = String(formData.get("user") ?? "");
  const add = String(formData.get("add") ?? "") === "1";
  if (!key.test(k) || !uuid.test(user)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("space_feature_person", { p_key: k, p_user: user, p_add: add });
  done(!!error);
}
