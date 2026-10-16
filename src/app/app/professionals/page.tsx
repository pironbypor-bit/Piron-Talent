import type { Metadata } from "next";
import { requireFeature } from "@/lib/app/features";
import { getT } from "@/lib/i18n/server";
import { HomeStrip } from "../home-strip";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Professionals") };
}

/** Step 2 placeholder. The catalogue (cards, filters, Book) arrives in step 3 of docs/piron-home-three-pages-plan.html. */
export default async function ProfessionalsPage() {
  await requireFeature("home_pages");
  const t = await getT();
  return (
    <main className="px-4 pb-24 pt-4">
      <HomeStrip current="professionals" t={t} />
      <section className="card p-5">
        <h1 className="text-lg font-bold">{t("Available professionals")}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t("This page is being built. Soon you will find people and companies here and book them.")}</p>
      </section>
    </main>
  );
}
