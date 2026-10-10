"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function reviewIdentity(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["checked", "rejected"].includes(status)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_review_identity", { p_id: id, p_status: status, p_note: note });
  if (error) redirect("/admin/identity?error=1");
  revalidatePath("/admin/identity");
  redirect("/admin/identity");
}
