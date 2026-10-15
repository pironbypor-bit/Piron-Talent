"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/app/space";

export async function resolveDispute(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const resolution = String(formData.get("resolution") ?? "").trim().slice(0, 2000) || null;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["reviewing", "resolved", "dismissed"].includes(status)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_dispute", { p_id: id, p_status: status, p_resolution: resolution });
  if (error) redirect("/admin/disputes?error=1");
  await logAdminAction(`Dispute ${status}`, id);
  revalidatePath("/admin/disputes");
  redirect("/admin/disputes");
}
