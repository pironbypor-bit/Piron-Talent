"use server";

import { getLocale } from "@/lib/i18n/server";
import { createClient, getUserId } from "@/lib/supabase/server";
import { fieldErrors, formEntries, projectRequestSchema, type FormState } from "@/lib/validation";

const KEYS = ["contact_name", "contact", "business_name", "category_id", "details", "budget_min", "budget_max", "needed_by", "website"];

/** Saves a "Post a project" request. Works without an account; links the row when someone is signed in. */
export async function submitProjectRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formEntries(formData, KEYS);
  const parsed = projectRequestSchema.safeParse(values);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    if (errors.website) return { ok: true }; // a bot filled the hidden field: pretend it worked, store nothing
    return { ok: false, errors, values, message: "Please check the highlighted fields." };
  }
  const { website: _honeypot, ...row } = parsed.data;
  void _honeypot;
  const [supabase, userId, locale] = await Promise.all([createClient(), getUserId(), getLocale()]);
  const { error } = await supabase.from("project_requests").insert({ ...row, user_id: userId, locale });
  if (error) {
    console.error("project_requests insert failed:", error.message);
    return { ok: false, values, message: "Something went wrong. Please try again." };
  }
  return { ok: true };
}
