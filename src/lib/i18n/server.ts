import { cache } from "react";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, makeT, resolveLocale, type Locale, type T } from "./core";
import { messagesFor } from "./messages";

/** The language for this request: this device's choice, else the browser's language. */
export const getLocale = cache(async (): Promise<Locale> => {
  const cookie = (await cookies()).get(LANG_COOKIE)?.value;
  const accept = (await headers()).get("accept-language");
  return resolveLocale(cookie, accept);
});

/** t() for server components and server actions: const t = await getT(); t("Post a project"). */
export async function getT(): Promise<T> {
  return makeT(messagesFor(await getLocale()));
}
