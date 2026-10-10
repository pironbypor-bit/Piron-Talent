"use server";

import { redirect } from "next/navigation";
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
  if (error) return { ok: false, message: "Wrong email or password.", values: echo };
  redirect(safeNext(values.next));
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
