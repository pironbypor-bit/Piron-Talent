"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { credentialsSchema, fieldErrors, formEntries, signupSchema, type FormState } from "@/lib/validation";

/** Only send people to paths on this site after login. */
const safeNext = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard");

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formEntries(formData, ["display_name", "email", "password"]);
  const echo = { display_name: values.display_name, email: values.email };
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values: echo };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.display_name } },
  });
  if (error) {
    console.error("signUp failed:", error.message);
    return { ok: false, message: "Could not create the account.", values: echo };
  }
  if (data.session) redirect("/dashboard");
  return { ok: true, message: "Check your email to confirm your account, then log in." };
}

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formEntries(formData, ["email", "password", "next"]);
  const echo = { email: values.email };
  const parsed = credentialsSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values: echo };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: loginMessage(error.message), values: echo };
  redirect(safeNext(values.next));
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Supabase Auth error text to the key the form shows. */
function loginMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("not confirmed")) return "Please confirm your email first. Check your inbox for the link.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  return "Wrong email or password.";
}

/** The site's own origin, for links in emails. */
async function origin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return proto + "://" + host;
}

export async function forgotPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = z.email().safeParse(email);
  if (!parsed.success) return { ok: false, errors: { email: "Please fill in this field." }, values: { email } };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: (await origin()) + "/auth/callback?next=/reset-password" });
  // Always the same answer, so the form does not reveal which emails have accounts.
  return { ok: true, message: "If that email has an account, a reset link is on its way." };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { ok: false, errors: { password: "At least 8 characters" } };
  if (password.length > 200) return { ok: false, errors: { password: "Too long." } };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: "This link has expired. Request a new one." };
  return { ok: true, message: "Password updated. You are logged in." };
}
