"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/app/space";

export async function reviewPayoutAccount(formData: FormData) {
  const user = String(formData.get("user") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(user) || !["approve", "reject"].includes(decision)) return;
  const { error } = await (await createClient()).rpc("admin_review_payout_account", { p_user: user, p_approve: decision === "approve", p_note: note });
  if (!error) await logAdminAction(`Payout account ${decision === "approve" ? "approved" : "rejected"}`, user);
  revalidatePath("/admin/payout-accounts");
  redirect(error ? "/admin/payout-accounts?error=1" : "/admin/payout-accounts");
}
