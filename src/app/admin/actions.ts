"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/app/space";
import { APPLICANT_STATUSES, JOB_STATUSES, REQUEST_STATUSES } from "@/lib/pilot";

// Every change goes through the admin_* database functions (migration 0003), which check is_admin() themselves.
// On failure the page is reopened with ?error=1 and shows a plain message.

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optionalNumber = (fd: FormData, k: string) => (str(fd, k) === "" ? null : Number(str(fd, k)));
const optionalText = (fd: FormData, k: string) => str(fd, k) || null;
const uuid = /^[0-9a-f-]{36}$/i;

async function call(path: string, fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) {
    console.error(`${fn} failed:`, error.message);
    redirect(`${path}?error=1`);
  }
  const target = Object.values(args).find((v) => typeof v === "string" && uuid.test(v));
  await logAdminAction(fn.replace(/^admin_/, "").replace(/_/g, " "), typeof target === "string" ? target : null);
  revalidatePath("/admin");
  revalidatePath(path);
  redirect(path);
}

export async function setRequestStatus(formData: FormData) {
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!uuid.test(id) || !(REQUEST_STATUSES as string[]).includes(status)) return;
  await call(`/admin/requests/${id}`, "admin_set_request", { p_id: id, p_status: status, p_note: optionalText(formData, "note") });
}

export async function setApplicationStatus(formData: FormData) {
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!uuid.test(id) || !(APPLICANT_STATUSES as string[]).includes(status)) return;
  await call("/admin", "admin_set_application", { p_id: id, p_status: status, p_note: optionalText(formData, "note") });
}

export async function matchRequest(formData: FormData) {
  const request = str(formData, "request_id");
  const application = str(formData, "application_id");
  if (!uuid.test(request) || !uuid.test(application)) return;
  const price = optionalNumber(formData, "price");
  if (price !== null && !(price >= 0)) return;
  await call(`/admin/requests/${request}`, "admin_match", {
    p_request: request,
    p_application: application,
    p_price: price,
    p_note: optionalText(formData, "note"),
  });
}

export async function setJobStatus(formData: FormData) {
  const id = str(formData, "id");
  const request = str(formData, "request_id");
  const status = str(formData, "status");
  if (!uuid.test(id) || !uuid.test(request) || !(JOB_STATUSES as string[]).includes(status)) return;
  const price = optionalNumber(formData, "price");
  if (price !== null && !(price >= 0)) return;
  await call(`/admin/requests/${request}`, "admin_set_job", { p_job: id, p_status: status, p_price: price, p_note: optionalText(formData, "note") });
}
