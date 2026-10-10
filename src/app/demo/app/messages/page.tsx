import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { ThreadList } from "./thread-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Messages") };
}

export default async function AppMessages() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="px-4 py-4">
      <h1 className="text-xl font-bold">{t("Messages")}</h1>
      <p className="text-sm text-ink-muted">{t("Messaging opens only after a quote or an invitation, so nobody receives unwanted messages.")}</p>
      <ThreadList locale={locale} />
    </main>
  );
}
