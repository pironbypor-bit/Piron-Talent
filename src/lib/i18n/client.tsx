"use client";

import { createContext, useContext, useMemo } from "react";
import { makeT, type Locale, type Messages, type T } from "./core";

const Ctx = createContext<{ locale: Locale; messages: Messages | null }>({ locale: "en", messages: null });

/** Set once in the root layout with the language for this page. */
export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages | null; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** t() for client components: const t = useT(); t("New order"). */
export function useT(): T {
  const { messages } = useContext(Ctx);
  return useMemo(() => makeT(messages), [messages]);
}

export const useLocale = (): Locale => useContext(Ctx).locale;
