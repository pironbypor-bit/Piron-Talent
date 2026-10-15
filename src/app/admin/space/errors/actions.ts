"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Mark an error fixed, ignored or open again. The database function checks the owner and writes the audit line. */
export async function setErrorStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  const back = String(formData.get("back") ?? "open");
  if (!Number.isInteger(id) || id <= 0 || !["open", "fixed", "ignored"].includes(status)) return;
  const supabase = await createClient();
  await supabase.rpc("space_set_error_status", { p_id: id, p_status: status });
  revalidatePath("/admin/space/errors");
  revalidatePath("/admin/space");
  redirect(`/admin/space/errors?filter=${["open", "fixed", "ignored", "all"].includes(back) ? back : "open"}`);
}

/** Owner only: throws on purpose so you can see the whole chain work (error screen, then the line in the list). */
export async function sendTestError() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_owner");
  if (data !== true) return;
  throw new Error("Test error from Piron Work Space (safe to mark as fixed)");
}
