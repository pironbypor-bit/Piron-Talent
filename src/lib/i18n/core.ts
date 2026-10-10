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

export const ALL_LANGUAGES = ["km", "en"] as const;
export type Locale = (typeof ALL_LANGUAGES)[number];
/** Cambodia first: a browser we cannot place gets Khmer. */
export const DEFAULT_LOCALE: Locale = "km";

/** The language to show: this device's choice, else Khmer. Browsers in Cambodia are often set to English, so the
 * browser language is not used; one tap on EN in the header is remembered on the device. */
export function resolveLocale(cookie: string | null | undefined): Locale {
  return !!cookie && (ALL_LANGUAGES as readonly string[]).includes(cookie) ? (cookie as Locale) : DEFAULT_LOCALE;
}
