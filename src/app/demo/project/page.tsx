import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { ProjectDemo } from "./project-demo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Project page") };
}

export default async function DemoProjectPage() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  void t;
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <ProjectDemo locale={locale} />
    </main>
  );
}
