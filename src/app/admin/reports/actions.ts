"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setReportStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["reviewing", "resolved", "dismissed"].includes(status)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_report_status", { p_id: id, p_status: status, p_note: note });
  if (error) redirect("/admin/reports?error=1");
  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}
