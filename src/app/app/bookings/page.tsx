import type { Metadata } from "next";
import { requireFeature } from "@/lib/app/features";
import { getT } from "@/lib/i18n/server";
import { HomeStrip } from "../home-strip";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Bookings") };
}

/** Step 2 placeholder. The list of bookings and applications arrives in step 5 of docs/piron-home-three-pages-plan.html. */
export default async function BookingsPage() {
  await requireFeature("home_pages");
  const t = await getT();
  return (
    <main className="px-4 pb-24 pt-4">
      <HomeStrip current="bookings" t={t} />
      <section className="card p-5">
        <h1 className="text-lg font-bold">{t("My bookings and applications")}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t("This page is being built. Soon your bookings, requests and job applications will be listed here.")}</p>
      </section>
    </main>
  );
}
