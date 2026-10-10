"use server";

import { getLocale } from "@/lib/i18n/server";
import { createClient, getUserId } from "@/lib/supabase/server";
import { fieldErrors, formEntries, providerApplicationSchema, type FormState } from "@/lib/validation";

const KEYS = ["full_name", "contact", "city", "category_id", "skills", "experience_years", "portfolio_url", "website"];

/** Saves a "Join as a provider" application. Works without an account; links the row when someone is signed in. */
export async function submitProviderApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formEntries(formData, KEYS);
  const parsed = providerApplicationSchema.safeParse(values);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    if (errors.website) return { ok: true };
    return { ok: false, errors, values, message: "Please check the highlighted fields." };
  }
  const { website: _honeypot, ...row } = parsed.data;
  void _honeypot;
  const [supabase, userId, locale] = await Promise.all([createClient(), getUserId(), getLocale()]);
  const { error } = await supabase.from("provider_applications").insert({ ...row, user_id: userId, locale });
  if (error) {
    console.error("provider_applications insert failed:", error.message);
    return { ok: false, values, message: "Something went wrong. Please try again." };
  }
  return { ok: true };
}
