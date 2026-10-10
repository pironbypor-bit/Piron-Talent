// English text is the key: t("Post a project") looks the words up in the chosen language's list and falls back to the
// English when there is no translation yet, so nothing ever shows blank. Values go in with {name}: t("{n} quotes", { n: 3 }).
// When one English word needs two translations, add a context after "@@" (t("Open@@status")): English shows the part before it.

export type Messages = Record<string, string>;
export type Vars = Record<string, string | number>;
export type T = (text: string, vars?: Vars) => string;

export function translate(messages: Messages | null, text: string, vars?: Vars): string {
  const s = (messages && messages[text]) || text.split("@@")[0];
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

export const makeT = (messages: Messages | null): T => (text, vars) => translate(messages, text, vars);

/** The cookie that keeps the language this person chose on this device. */
export const LANG_COOKIE = "lang";

export const ALL_LANGUAGES = ["en", "km"] as const;
export type Locale = (typeof ALL_LANGUAGES)[number];

/** The language to show: this device's choice, else the browser's first language, else English. */
export function resolveLocale(cookie: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  const ready = (l: string | null | undefined): l is Locale => !!l && (ALL_LANGUAGES as readonly string[]).includes(l);
  if (ready(cookie)) return cookie;
  const first = acceptLanguage?.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return ready(first) ? first : "en";
}
