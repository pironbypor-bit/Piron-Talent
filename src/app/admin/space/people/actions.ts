"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f-]{36}$/i;

/** Pause or resume a person. The database function checks that the caller is the owner and writes the audit line. */
export async function setPaused(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const pause = String(formData.get("pause") ?? "") === "1";
  const note = String(formData.get("note") ?? "").trim().slice(0, 120) || null;
  if (!uuid.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("space_set_paused", { p_id: id, p_paused: pause, p_note: note });
  revalidatePath("/admin/space/people");
  redirect(`/admin/space/people/${id}${error ? "?error=1" : ""}`);
}
