import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui";
import { Dropdown } from "@/components/dropdown";
import { requireFeature } from "@/lib/app/features";
import { countBookingsForMe, getMe, listMyBookings, myApplications, myJobs, myQuotes } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { HomeStrip } from "../home-strip";
import { BookingCard } from "./booking-card";
import { ItemRow, type Group, type Item } from "./item-row";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Bookings") };
}

const TYPES = ["all", "bookings", "jobs", "applications", "quotes"] as const;
const GROUPS: Group[] = ["waiting", "active", "done", "cancelled"];

type Params = { type?: string; status?: string; sent?: string; done?: string; error?: string };

/** One place for everything I booked, applied for, quoted or work on. Replaces Profile > My jobs and requests. */
export default async function BookingsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireFeature("home_pages");
  const [t, locale, me, bookings, jobs, apps, quotes, waiting, params] = await Promise.all([getT(), getLocale(), getMe(), listMyBookings(), myJobs(), myApplications(), myQuotes(), countBookingsForMe(), searchParams]);
  if (!me) return null;
  const type = (TYPES as readonly string[]).includes(params.type ?? "") ? (params.type as (typeof TYPES)[number]) : "all";
  const status = (GROUPS as string[]).includes(params.status ?? "") ? (params.status as Group) : null;

  // Bookings that already became a job are shown as the job, so nothing appears twice.
  const openBookings = bookings.filter((b) => b.status !== "accepted");
  const forMe = openBookings.filter((b) => b.mine === "provider" && b.status === "requested");
  const needsMe = openBookings.filter((b) => b.mine === "customer" && b.status === "countered");
  const grp = (s: string): Group => (s === "requested" || s === "countered" ? "waiting" : "cancelled");

  const jobLabel: Record<string, [Group, string]> = { accepted: ["active", t("In progress")], delivered: ["active", t("Work delivered")], confirmed: ["done", t("Completed")], cancelled: ["cancelled", t("Cancelled")] };
  const appLabel: Record<string, [Group, string]> = { submitted: ["waiting", t("Submitted")], shortlisted: ["waiting", t("Shortlisted")], accepted: ["done", t("Accepted")], rejected: ["cancelled", t("Not chosen")], withdrawn: ["cancelled", t("Withdrawn")] };
  const quoteLabel: Record<string, [Group, string]> = { pending: ["waiting", t("Quote sent")], declined: ["cancelled", t("Declined")], withdrawn: ["cancelled", t("Withdrawn")], expired: ["cancelled", t("Expired")] };

  const items: (Item & { at: string })[] = [
    ...jobs.map((j) => {
      const [group, label] = jobLabel[j.status] ?? ["active", j.status];
      const other = j.mine === "customer" ? j.provider : j.customer;
      return { key: `j${j.id}`, type: "job" as const, group, title: j.title, who: `${other.display_name} · ${j.mine === "customer" ? t("As customer") : t("As provider")}`, when: formatDate(j.created_at, locale), label, href: `/app/post/${j.post_id}`, amount: `$${j.agreed_price}`, hireAgain: j.mine === "customer" && j.status === "confirmed" ? `/app/post/new?rehire=${j.post_id}&to=${j.provider_id}` : undefined, at: j.created_at };
    }),
    ...apps.map((a) => {
      const [group, label] = appLabel[a.status] ?? ["waiting", a.status];
      return { key: `a${a.id}`, type: "application" as const, group, title: a.job.title, who: a.job.city ? t(a.job.city) : null, when: formatDate(a.created_at, locale), label, href: `/app/jobs/${a.job.id}`, at: a.created_at };
    }),
    ...quotes.map((q) => {
      const [group, label] = quoteLabel[q.status] ?? ["cancelled", q.status];
      return { key: `q${q.id}`, type: "quote" as const, group, title: q.post.title, who: null, when: formatDate(q.created_at, locale), label, href: `/app/post/${q.post.id}`, amount: `$${q.price}`, at: q.created_at };
    }),
  ];
  const wanted = (k: Item["type"]) => type === "all" || type === `${k}s`;
  const shownItems = items.filter((i) => wanted(i.type) && (!status || i.group === status)).sort((a, b) => b.at.localeCompare(a.at));
  const shownBookings = openBookings.filter((b) => !forMe.includes(b) && !needsMe.includes(b) && wanted("booking") && (!status || grp(b.status) === status));
  const total = shownItems.length + shownBookings.length;

  const qs = (over: Partial<Params>) => {
    const sp = new URLSearchParams();
    const merged = { type: type === "all" ? undefined : type, status: status ?? undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, String(v));
    const s = sp.toString();
    return s ? `/app/bookings?${s}` : "/app/bookings";
  };
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-ink bg-ink text-white" : "border-stone-300 bg-white hover:bg-brand-50"}`;
  const err: Record<string, string> = {
    limit: t("You sent several requests today. Try again tomorrow."),
    open: t("You already have an open request with this person. Wait for their answer or cancel it first."),
    unavailable: t("This person is not taking bookings right now."),
    expired: t("This request has expired."),
    price: t("Please enter the price you will charge."),
    failed: t("Something went wrong. Please try again."),
  };
  const statusLabel: Record<Group, string> = { waiting: t("Waiting"), active: t("Active"), done: t("Done"), cancelled: t("Cancelled") };
  const typeLabel: Record<(typeof TYPES)[number], string> = { all: t("All"), bookings: t("Bookings"), jobs: t("Jobs"), applications: t("Applications"), quotes: t("Quotes") };

  return (
    <main className="px-4 pb-24 pt-4">
      <HomeStrip current="bookings" t={t} badge={waiting} />
      <h1 className="text-sm font-bold">{t("My bookings and applications")}</h1>
      {params.sent === "1" && <div className="mt-3"><Notice tone="success">{t("Booking request sent. You will see the answer here and in your notifications.")}</Notice></div>}
      {params.done === "1" && <div className="mt-3"><Notice tone="success">{t("Done.")}</Notice></div>}
      {params.error && <div className="mt-3"><Notice tone="error">{err[params.error] ?? err.failed}</Notice></div>}

      {(forMe.length > 0 || needsMe.length > 0) && (
        <section className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-800">{t("Needs your answer")} · {forMe.length + needsMe.length}</h2>
          <ul className="mt-2 space-y-3">{[...forMe, ...needsMe].map((r) => <li key={r.id}><BookingCard r={r} t={t} /></li>)}</ul>
        </section>
      )}

      <form method="get" action="/app/bookings" className="mt-4 w-1/2 min-w-40">
        {status && <input type="hidden" name="status" value={status} />}
        <Dropdown compact submitOnChange name="type" defaultValue={type === "all" ? "" : type} label={t("Type")} options={TYPES.map((k) => ({ value: k === "all" ? "" : k, label: typeLabel[k] }))} />
      </form>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link href={qs({ status: undefined })} className={chip(!status)}>{t("Any status")}</Link>
        {GROUPS.map((g) => <Link key={g} href={qs({ status: status === g ? undefined : g })} className={chip(status === g)}>{statusLabel[g]}</Link>)}
      </div>

      {total === 0 ? (
        <p className="card mt-4 p-4 text-sm text-ink-muted">
          {t("No bookings or applications yet.")} <Link href="/app/professionals" className="font-medium underline">{t("Explore professionals")}</Link>
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {shownBookings.map((r) => <li key={r.id}><BookingCard r={r} t={t} /></li>)}
          {shownItems.map((i) => <li key={i.key}><ItemRow i={i} t={t} /></li>)}
        </ul>
      )}
    </main>
  );
}
