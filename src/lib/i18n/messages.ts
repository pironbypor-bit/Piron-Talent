import type { Locale, Messages } from "./core";
import km from "./km/index.ts";

const LISTS: Partial<Record<Locale, Messages>> = { km };

/** The word list for a language (null for English, the source text). */
export const messagesFor = (locale: Locale): Messages | null => LISTS[locale] ?? null;
