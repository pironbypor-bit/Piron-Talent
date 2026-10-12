import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getLocale, getT } from "@/lib/i18n/server";
import { Directory, type DirectoryInitial } from "./directory";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Providers") };
}

/** Sample public directory. Filters can be preset from the URL (?category=creative&city=phnom-penh) so other demo screens can link in. */
export default async function DemoProvidersPage({ searchParams }: { searchParams: Promise<DirectoryInitial> }) {
  const [t, locale, initial] = await Promise.all([getT(), getLocale(), searchParams]);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageTitle lead={t("Sample directory. Real providers appear after identity checks and the first completed jobs.")}>{t("Providers")}</PageTitle>
      <Directory locale={locale} initial={{ category: initial.category, city: initial.city, q: initial.q?.slice(0, 60) }} />
    </main>
  );
}
