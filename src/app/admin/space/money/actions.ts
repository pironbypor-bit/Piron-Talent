"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const month = /^\d{4}-\d{2}-01$/;

function back(m: string, error = false): never {
  revalidatePath("/admin/space/money");
  redirect(`/admin/space/money?month=${month.test(m) ? m : ""}${error ? "&error=1" : ""}`);
}

/** Add one revenue or cost entry. The database function checks the owner, the values and writes the audit line. */
export async function addMoneyEntry(formData: FormData) {
  const m = String(formData.get("month") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const type = String(formData.get(kind === "income" ? "type_income" : "type_cost") ?? "").trim().slice(0, 40);
  const note = String(formData.get("note") ?? "").trim().slice(0, 120);
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  const repeats = formData.get("repeats") === "on";
  if (!month.test(m) || !["income", "cost"].includes(kind) || !type || !Number.isFinite(amount) || amount < 0) back(m, true);
  const supabase = await createClient();
  const { error } = await supabase.rpc("space_money_add", { p_kind: kind, p_month: m, p_type: type, p_amount: Math.round(amount * 100) / 100, p_note: note || null, p_repeats: repeats });
  back(m, !!error);
}

export async function deleteMoneyEntry(formData: FormData) {
  const m = String(formData.get("month") ?? "");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) back(m, true);
  const supabase = await createClient();
  const { error } = await supabase.rpc("space_money_delete", { p_id: id });
  back(m, !!error);
}

/** Stop a monthly entry from this month on. Earlier months keep it. */
export async function stopMoneyEntry(formData: FormData) {
  const m = String(formData.get("month") ?? "");
  const id = Number(formData.get("id"));
  if (!month.test(m) || !Number.isInteger(id) || id <= 0) back(m, true);
  const supabase = await createClient();
  const { error } = await supabase.rpc("space_money_stop", { p_id: id, p_month: m });
  back(m, !!error);
}
