import { cache } from "react";
import { cookies } from "next/headers";
import { LANG_COOKIE, makeT, resolveLocale, type Locale, type T } from "./core";
import { messagesFor } from "./messages";

/** The language for this request: this device's choice, else Khmer. */
export const getLocale = cache(async (): Promise<Locale> => {
  return resolveLocale((await cookies()).get(LANG_COOKIE)?.value);
});

/** t() for server components and server actions: const t = await getT(); t("Post a project"). */
export async function getT(): Promise<T> {
  return makeT(messagesFor(await getLocale()));
}
