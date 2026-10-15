import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronRight, FileText, Landmark, Plus, ShieldCheck } from "lucide-react";
import { Pill } from "@/components/ui";
import { getMe, listInvoices, myBusinesses, myJobs, myPayoutAccount } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";
import type { InvoiceRow } from "@/lib/app/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Payments") };
}

const PAYOUT_TONE = { pending: "amber", approved: "green", rejected: "red" } as const;
const PAYOUT_LABEL = { pending: "Waiting for review", approved: "Approved", rejected: "Not approved" } as const;

/** One place for everything about money: invoices, payout account, jobs to invoice, team pay terms. Records only. */
export default async function PaymentsPage() {
  const [t, me, invoices, payout, jobs, companies] = await Promise.all([getT(), getMe(), listInvoices(), myPayoutAccount(), myJobs(), myBusinesses()]);
  if (!me) return null;
  const issued = invoices.filter((i) => i.issuer_id === me.id);
  const received = invoices.filter((i) => i.customer_id === me.id);
  const open = (rows: InvoiceRow[]) => rows.filter((i) => i.status === "issued" || i.status === "paid_claimed").reduce((n, i) => n + i.amount, 0);
  const toConfirm = issued.filter((i) => i.status === "paid_claimed").length;
  const toPay = received.filter((i) => i.status === "issued").length;
  const invoiceable = jobs.filter((j) => j.mine === "provider" && ["accepted", "delivered", "confirmed"].includes(j.status));
  const row = "card mt-3 flex items-center gap-3 px-4 py-3 hover:bg-brand-50";
  const iconBox = "flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800";

  return (
    <main className="px-4 pb-24 pt-4">
      <section className="hero-amber rounded-3xl p-4">
        <h1 className="text-xl font-bold">{t("Payments")}</h1>
        <p className="mt-1 text-sm text-brand-900">{t("Records of what was agreed and paid. Piron Work does not take or move money.")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl bg-white/90 p-3">
            <p className="text-xs text-ink-muted">{t("To receive")}</p>
            <p className="text-lg font-bold">${open(issued).toFixed(2)}</p>
            {toConfirm > 0 && <p className="text-xs font-medium text-brand-800">{t("{n} to confirm", { n: toConfirm })}</p>}
          </div>
          <div className="rounded-2xl bg-white/90 p-3">
            <p className="text-xs text-ink-muted">{t("To pay")}</p>
            <p className="text-lg font-bold">${open(received).toFixed(2)}</p>
            {toPay > 0 && <p className="text-xs font-medium text-brand-800">{t("{n} waiting for you", { n: toPay })}</p>}
          </div>
        </div>
      </section>

      <Link href="/app/invoices" className={row}>
        <span className={iconBox}><FileText className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("Invoices and payments")}</span>
          <span className="block text-sm text-ink-muted">{t("{a} issued by me · {b} sent to me", { a: issued.length, b: received.length })}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-muted" />
      </Link>

      <Link href="/app/profile/payout" className={row}>
        <span className={iconBox}><Landmark className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("Payout account")}</span>
          <span className="mt-0.5 block text-sm text-ink-muted">
            {payout ? <Pill tone={PAYOUT_TONE[payout.status]}>{t(PAYOUT_LABEL[payout.status])}</Pill> : t("Where you want to be paid. The team checks the name against your ID.")}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-muted" />
      </Link>

      <section className="card mt-3 overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-3">
          <span className={iconBox}><Plus className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("Create an invoice")}</p>
            <p className="text-sm text-ink-muted">{t("Choose a job you are doing. The invoice cannot be more than the agreed price.")}</p>
          </div>
        </div>
        <ul className="mt-2 divide-y divide-stone-100 border-t border-stone-100">
          {invoiceable.map((j) => (
            <li key={j.id}>
              <Link href={`/app/invoices/new?job=${j.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-brand-50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{j.title}</span>
                  <span className="block text-xs text-ink-muted">{j.customer.display_name} · ${Number(j.agreed_price).toFixed(2)}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-muted" />
              </Link>
            </li>
          ))}
          {invoiceable.length === 0 && <li className="px-4 py-3 text-sm text-ink-muted">{t("No accepted jobs to invoice yet.")}</li>}
        </ul>
      </section>

      <section className="card mt-3 overflow-hidden">
        <div className="flex items-center gap-3 px-4 pt-3">
          <span className={iconBox}><Building2 className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("Team pay terms and records")}</p>
            <p className="text-sm text-ink-muted">{t("Rate, hours worked and what was paid, for each company you belong to.")}</p>
          </div>
        </div>
        <ul className="mt-2 divide-y divide-stone-100 border-t border-stone-100">
          {companies.map((c) => (
            <li key={c.id}>
              <Link href={`/app/profile/companies/${c.id}/terms`} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-brand-50">
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <ChevronRight className="size-4 shrink-0 text-ink-muted" />
              </Link>
            </li>
          ))}
          {companies.length === 0 && <li className="px-4 py-3 text-sm text-ink-muted">{t("You are not in a company yet.")}</li>}
        </ul>
      </section>

      <Link href="/app/settings" className={row}>
        <span className={iconBox}><ShieldCheck className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("Invoice and pay alerts")}</span>
          <span className="block text-sm text-ink-muted">{t("Choose which money messages reach you.")}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-muted" />
      </Link>
    </main>
  );
}
