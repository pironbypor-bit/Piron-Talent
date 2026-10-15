import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Field, Notice, Pill, inputClass } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { confirmInvoicePayment, markInvoicePaid, rejectInvoicePayment, voidInvoice } from "@/lib/app/actions";
import { getInvoice, getMe } from "@/lib/app/queries";
import { METHODS, METHOD_LABEL, STATUS_LABEL, STATUS_TONE, money } from "@/lib/app/invoice-labels";
import { todayPP } from "@/lib/datetime";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const inv = await getInvoice(id);
  return { title: inv ? `${t("Invoice")} ${inv.number}` : t("Invoice") };
}

const small = "rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-brand-50";

/** One invoice. Printable. Who can do what follows the status: the customer marks paid, the provider confirms or voids. */
export default async function InvoicePage({ params, searchParams }: Props) {
  const [{ id }, { error }, t, locale, me] = await Promise.all([params, searchParams, getT(), getLocale(), getMe()]);
  const inv = await getInvoice(id);
  if (!inv || !me) notFound();
  const isIssuer = inv.issuer_id === me.id;
  const isCustomer = inv.customer_id === me.id;
  const today = todayPP();
  const methodSelect = (
    <select name="method" defaultValue="cash" className={inputClass}>
      {METHODS.map((m) => <option key={m} value={m}>{t(METHOD_LABEL[m])}</option>)}
    </select>
  );

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/invoices" className="text-sm font-medium underline print:hidden">{t("Back")}</Link>
      {error && <div className="mt-3 print:hidden"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}

      <article className="card mt-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">{t("Invoice")}</p>
            <h1 className="text-xl font-bold">{inv.number}</h1>
          </div>
          <Pill tone={STATUS_TONE[inv.status]}>{t(STATUS_LABEL[inv.status])}</Pill>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs text-ink-muted">{t("From")}</dt><dd className="font-medium">{inv.issuer_name}</dd></div>
          <div><dt className="text-xs text-ink-muted">{t("To")}</dt><dd className="font-medium">{inv.customer_name}</dd></div>
          <div><dt className="text-xs text-ink-muted">{t("Issued")}</dt><dd>{formatDate(inv.issued_at, locale)}</dd></div>
          <div><dt className="text-xs text-ink-muted">{t("Due")}</dt><dd>{inv.due_on ? formatDate(inv.due_on, locale) : "-"}</dd></div>
        </dl>

        <div className="mt-5 border-t border-stone-200 pt-4">
          <p className="text-sm text-ink-muted">{t("For")}</p>
          <p className="font-medium">{inv.title}</p>
          {inv.note && <p className="mt-1 text-sm text-ink-muted">{inv.note}</p>}
        </div>

        <div className="mt-5 flex items-baseline justify-between border-t border-stone-200 pt-4">
          <span className="text-sm text-ink-muted">{t("Amount")}</span>
          <span className="text-2xl font-bold">{money(inv.amount, inv.currency)}</span>
        </div>

        {(inv.status === "paid_claimed" || inv.status === "received") && (
          <div className="mt-4 rounded-xl bg-stone-50 p-3 text-sm">
            <p>
              {inv.status === "received" ? t("Payment received") : t("Marked as paid by the customer")}
              {inv.paid_method ? ` · ${t(METHOD_LABEL[inv.paid_method])}` : ""}
              {inv.paid_on ? ` · ${formatDate(inv.paid_on, locale)}` : ""}
            </p>
            {inv.paid_ref && <p className="text-ink-muted">{t("Reference")}: {inv.paid_ref}</p>}
          </div>
        )}
        <p className="mt-5 text-xs leading-relaxed text-ink-muted">{t("This is a record made on Piron Work. Piron Work does not take or move money, and this is not a tax invoice.")}</p>
      </article>

      <div className="mt-3 flex flex-wrap gap-2 print:hidden"><PrintButton /></div>

      {isCustomer && inv.status === "issued" && (
        <form action={markInvoicePaid.bind(null, inv.id)} className="card mt-3 space-y-3 p-4 print:hidden">
          <h2 className="font-semibold">{t("I have paid")}</h2>
          <p className="text-sm text-ink-muted">{t("Pay the provider directly, then tell them here. They will confirm when the money arrives.")}</p>
          <Field label={t("How did you pay?")}>{methodSelect}</Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t("Date paid")}><input type="date" name="paid_on" defaultValue={today} className={inputClass} /></Field>
            <Field label={t("Reference")} optional={t("optional")}><input name="ref" maxLength={60} className={inputClass} /></Field>
          </div>
          <Button type="submit">{t("Mark as paid")}</Button>
        </form>
      )}
      {isCustomer && inv.status === "paid_claimed" && <p className="mt-3 text-sm print:hidden">{t("Waiting for the provider to confirm the payment.")}</p>}

      {isIssuer && inv.status === "paid_claimed" && (
        <div className="card mt-3 space-y-3 p-4 print:hidden">
          <h2 className="font-semibold">{t("Did the payment arrive?")}</h2>
          <div className="flex flex-wrap gap-2">
            <form action={confirmInvoicePayment.bind(null, inv.id)}><Button type="submit">{t("Yes, payment received")}</Button></form>
            <form action={rejectInvoicePayment.bind(null, inv.id)}><Button type="submit" variant="secondary">{t("Not received")}</Button></form>
          </div>
        </div>
      )}
      {isIssuer && inv.status === "issued" && (
        <div className="mt-3 space-y-3 print:hidden">
          <form action={confirmInvoicePayment.bind(null, inv.id)} className="card space-y-3 p-4">
            <h2 className="font-semibold">{t("Record a payment received")}</h2>
            <p className="text-sm text-ink-muted">{t("Use this if the customer paid you in person or did not mark it here.")}</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("How were you paid?")}>{methodSelect}</Field>
              <Field label={t("Date paid")}><input type="date" name="paid_on" defaultValue={today} className={inputClass} /></Field>
            </div>
            <Button type="submit">{t("Payment received")}</Button>
          </form>
          <form action={voidInvoice.bind(null, inv.id)}><button type="submit" className={small}>{t("Cancel this invoice")}</button></form>
        </div>
      )}
    </main>
  );
}
