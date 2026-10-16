import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui";
import { requireFeature } from "@/lib/app/features";
import { countBookingsForMe, getMe, listMyBookings } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";
import { HomeStrip } from "../home-strip";
import { BookingCard } from "./booking-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Bookings") };
}

/** Step 4: bookings. Step 5 adds job applications and quotes to this same page. */
export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ sent?: string; done?: string; error?: string }> }) {
  await requireFeature("home_pages");
  const [t, me, rows, waiting, { sent, done, error }] = await Promise.all([getT(), getMe(), listMyBookings(), countBookingsForMe(), searchParams]);
  if (!me) return null;
  const forMe = rows.filter((r) => r.mine === "provider" && r.status === "requested");
  const open = rows.filter((r) => !(r.mine === "provider" && r.status === "requested") && (r.status === "requested" || r.status === "countered" || r.status === "accepted"));
  const history = rows.filter((r) => !forMe.includes(r) && !open.includes(r));
  const err: Record<string, string> = {
    limit: t("You sent several requests today. Try again tomorrow."),
    open: t("You already have an open request with this person. Wait for their answer or cancel it first."),
    unavailable: t("This person is not taking bookings right now."),
    expired: t("This request has expired."),
    price: t("Please enter the price you will charge."),
    failed: t("Something went wrong. Please try again."),
  };

  return (
    <main className="px-4 pb-24 pt-4">
      <HomeStrip current="bookings" t={t} badge={waiting} />
      <h1 className="text-sm font-bold">{t("My bookings and applications")}</h1>
      {sent === "1" && <div className="mt-3"><Notice tone="success">{t("Booking request sent. You will see the answer here and in your notifications.")}</Notice></div>}
      {done === "1" && <div className="mt-3"><Notice tone="success">{t("Done.")}</Notice></div>}
      {error && <div className="mt-3"><Notice tone="error">{err[error] ?? err.failed}</Notice></div>}

      {forMe.length > 0 && (
        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-800">{t("Needs your answer")} · {forMe.length}</h2>
          <ul className="mt-2 space-y-3">{forMe.map((r) => <li key={r.id}><BookingCard r={r} t={t} /></li>)}</ul>
        </section>
      )}
      <section className="mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-800">{t("Open")} · {open.length}</h2>
        {open.length === 0 ? (
          <p className="card mt-2 p-4 text-sm text-ink-muted">
            {t("No bookings yet.")} <Link href="/app/professionals" className="font-medium underline">{t("Explore professionals")}</Link>
          </p>
        ) : (
          <ul className="mt-2 space-y-3">{open.map((r) => <li key={r.id}><BookingCard r={r} t={t} /></li>)}</ul>
        )}
      </section>
      {history.length > 0 && (
        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("Earlier")} · {history.length}</h2>
          <ul className="mt-2 space-y-3">{history.map((r) => <li key={r.id}><BookingCard r={r} t={t} /></li>)}</ul>
        </section>
      )}
    </main>
  );
}
