import type { Metadata } from "next";
import { Notice, PageTitle } from "@/components/ui";
import { getLocale, getT } from "@/lib/i18n/server";
import { Thread } from "./thread";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Messages") };
}

export default async function DemoMessagesPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageTitle>{t("Messages")}</PageTitle>
      <div className="mb-6">
        <Notice tone="info">{t("Messaging opens only after a quote or an invitation, so nobody receives unwanted messages.")}</Notice>
      </div>
      <Thread locale={locale} />
    </main>
  );
}
