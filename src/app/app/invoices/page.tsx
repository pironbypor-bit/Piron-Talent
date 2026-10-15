import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Pill } from "@/components/ui";
import { getMe, listInvoices } from "@/lib/app/queries";
import { STATUS_LABEL, STATUS_TONE, money } from "@/lib/app/invoice-labels";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { InvoiceRow } from "@/lib/app/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Invoices") };
}

/** Invoices and payment records: what I issued and what was sent to me. Records only; Piron Work does not move money. */
export default async function InvoicesPage() {
  const [t, locale, me, all] = await Promise.all([getT(), getLocale(), getMe(), listInvoices()]);
  if (!me) return null;
  const issued = all.filter((i) => i.issuer_id === me.id);
  const received = all.filter((i) => i.customer_id === me.id);
  const open = (rows: InvoiceRow[]) => rows.filter((i) => i.status === "issued" || i.status === "paid_claimed").reduce((n, i) => n + i.amount, 0);
  const paid = (rows: InvoiceRow[]) => rows.filter((i) => i.status === "received").reduce((n, i) => n + i.amount, 0);

  const list = (rows: InvoiceRow[], who: "issuer" | "customer") => (
    <ul className="mt-2 space-y-2">
      {rows.map((i) => (
        <li key={i.id}>
          <Link href={`/app/invoices/${i.id}`} className="card flex items-center gap-3 p-3 hover:bg-brand-50">
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-ink-muted">{i.number} · {formatDate(i.issued_at, locale)}</span>
              <span className="block truncate font-medium">{i.title}</span>
              <span className="block text-sm text-ink-muted">{who === "issuer" ? i.customer_name : i.issuer_name}</span>
            </span>
            <span className="text-right">
              <span className="block font-semibold">{money(i.amount, i.currency)}</span>
              <Pill tone={STATUS_TONE[i.status]}>{t(STATUS_LABEL[i.status])}</Pill>
            </span>
            <ChevronRight className="size-4 shrink-0 text-ink-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/profile" className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <h1 className="text-xl font-bold">{t("Invoices")}</h1>
        <p className="text-sm text-ink-muted">{t("Records of what was agreed and paid. Piron Work does not take or move money. These are not tax invoices.")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-stone-50 p-3">
            <p className="text-xs text-ink-muted">{t("To receive")}</p>
            <p className="text-lg font-bold">${open(issued).toFixed(2)}</p>
            <p className="text-xs text-ink-muted">{t("Received so far")}: ${paid(issued).toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-stone-50 p-3">
            <p className="text-xs text-ink-muted">{t("To pay")}</p>
            <p className="text-lg font-bold">${open(received).toFixed(2)}</p>
            <p className="text-xs text-ink-muted">{t("Paid so far")}: ${paid(received).toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="px-1 text-sm font-semibold text-ink-muted">{t("Sent to me")} · {received.length}</h2>
        {received.length === 0 ? <p className="card mt-2 p-3 text-sm text-ink-muted">{t("No invoices sent to you.")}</p> : list(received, "customer")}
      </section>
      <section className="mt-4">
        <h2 className="px-1 text-sm font-semibold text-ink-muted">{t("Issued by me")} · {issued.length}</h2>
        {issued.length === 0 ? <p className="card mt-2 p-3 text-sm text-ink-muted">{t("You have not issued an invoice. Open an accepted job and choose Create an invoice.")}</p> : list(issued, "issuer")}
      </section>
    </main>
  );
}
