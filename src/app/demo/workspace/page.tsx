import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getLocale, getT } from "@/lib/i18n/server";
import { Board } from "./board";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Workspace") };
}

export default async function DemoWorkspacePage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageTitle lead={t("Newest first. No ranking, no ads. Phnom Penh only.")}>{t("Workspace")}</PageTitle>
      <Board locale={locale} />
    </main>
  );
}
