"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ALL_LANGUAGES, LANG_COOKIE, type Locale } from "@/lib/i18n/core";

/** Remembers the language chosen in the header on this device for a year. */
export async function setLocale(formData: FormData) {
  const lang = String(formData.get("lang") ?? "");
  if (!(ALL_LANGUAGES as readonly string[]).includes(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang as Locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
