import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getLocale, getT } from "@/lib/i18n/server";
import { Directory } from "./directory";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Providers") };
}

export default async function DemoProvidersPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageTitle>{t("Providers")}</PageTitle>
      <Directory locale={locale} />
    </main>
  );
}
