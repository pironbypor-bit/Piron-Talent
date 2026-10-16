import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Notice } from "@/components/ui";
import { Dropdown } from "@/components/dropdown";
import { PrintButton } from "@/components/print-button";
import { getReport, monthLabel, recentMonths } from "@/lib/app/space";
import { SpaceNav } from "../space-nav";

export const metadata: Metadata = { title: "Reports - Piron Work Space" };
export const dynamic = "force-dynamic";

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Number(n)).toFixed(2)}`;
const EXPORTS = [
  { kind: "people", label: "People", note: "Name, role, city, joined, provider, identity checked, jobs, posts. No contact details." },
  { kind: "jobs", label: "Jobs", note: "Project, status, agreed price, customer, provider, dates." },
  { kind: "invoices", label: "Invoices", note: "Number, from, to, title, amount, status, dates." },
];

function Block({ title, rows }: { title: string; rows: [string, string | number][] }) {
  return (
    <section className="break-inside-avoid rounded-2xl border border-stone-200 bg-white p-4 print:rounded-none print:border-stone-300 print:p-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-800 print:text-black">{title}</h2>
      <dl className="mt-2 space-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between border-b border-stone-100 pb-1">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Piron Work Space, step 7: the monthly owner report on one page (print or save as PDF), and the CSV downloads. */
export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: raw } = await searchParams;
  const options = recentMonths(12);
  const month = raw && options.includes(raw) ? raw : options[0];
  const r = await getReport(month);
  if (!r) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">Not allowed.</Notice>
      </main>
    );
  }
  const p = r.people;
  const m = r.market;
  const $ = r.money;
  const e = r.errors;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 print:hidden">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)] print:mt-0 print:block">
        <div className="print:hidden"><SpaceNav active="reports" /></div>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <form method="get" action="/admin/space/reports" className="w-56">
              <Dropdown small submitOnChange name="month" defaultValue={month} label="Month" options={options.map((x) => ({ value: x, label: monthLabel(x) }))} />
            </form>
            <PrintButton />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-4 print:rounded-none print:border-0 print:border-b-2 print:border-black print:px-0">
            <p className="text-xs text-ink-muted">Piron Work · owner report</p>
            <h2 className="text-2xl font-bold">{monthLabel(month)}</h2>
            <p className="mt-1 text-sm text-ink-muted">Numbers for this calendar month in Phnom Penh time. Money is your own book; Piron Work does not touch users&rsquo; money.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
            <Block title="People" rows={[["New this month", p.new], ["Total at the end of the month", p.total_at_end], ["Providers now", p.providers_now], ["Identity checked now", p.identity_checked_now], ["Paused now", p.paused_now]]} />
            <Block title="Marketplace" rows={[
              ["Projects posted", m.projects], ["Quotes sent", m.quotes], ["Quotes accepted", m.accepted], ["Work delivered", m.delivered], ["Jobs confirmed", m.confirmed],
              ...(m.bookings === undefined ? [] : ([["Booking requests", m.bookings], ["Bookings agreed", m.bookings_agreed ?? 0]] as [string, number][])),
              ["Reviews", m.reviews], ["Average stars", m.avg_stars === null ? "none" : m.avg_stars], ["Messages sent", m.messages], ["New companies", m.companies_new],
            ]} />
            <Block title="Money" rows={[["Revenue", usd($.revenue)], ["Costs", usd($.costs)], ["Profit", usd($.profit)], ["Paid between users (market size)", usd($.volume)]]} />
            <Block title="System and care" rows={[["New app errors", e.new], ["Errors seen this month", e.seen], ["Open errors now", e.open_now], ["Reports filed by users", r.reports_filed], ["Admin actions", r.admin_actions]]} />
          </div>

          <section className="rounded-2xl border border-stone-200 bg-white p-4 print:hidden">
            <h2 className="text-sm font-semibold">Downloads (CSV)</h2>
            <p className="text-xs text-ink-muted">Opens in Excel or Google Sheets. The money entries have their own download on the Money page.</p>
            <ul className="mt-3 divide-y divide-stone-100">
              {EXPORTS.map((x) => (
                <li key={x.kind} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{x.label}</span>
                    <span className="block text-xs text-ink-muted">{x.note}</span>
                  </span>
                  <a href={`/admin/space/reports/export/${x.kind}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-brand-50"><Download className="size-4" />Download</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
