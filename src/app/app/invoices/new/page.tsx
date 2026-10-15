import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { createInvoice } from "@/lib/app/actions";
import { invoiceRoom } from "@/lib/app/queries";
import { money } from "@/lib/app/invoice-labels";
import { getT } from "@/lib/i18n/server";
import { requireFeature } from "@/lib/app/features";

type Props = { searchParams: Promise<{ job?: string; error?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Create an invoice") };
}

/** One invoice for part or all of the agreed price of an accepted job. Only the provider of the job can issue it. */
export default async function NewInvoicePage({ searchParams }: Props) {
  await requireFeature("payments");
  const [{ job, error }, t] = await Promise.all([searchParams, getT()]);
  const room = job ? await invoiceRoom(job) : null;
  if (!room || !room.mine) notFound();
  const left = Math.max(0, room.agreed - room.used);

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/invoices" className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <h1 className="text-xl font-bold">{t("Create an invoice")}</h1>
        <p className="text-sm text-ink-muted">{room.title} · {room.customer}</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div><dt className="text-xs text-ink-muted">{t("Agreed price")}</dt><dd className="font-semibold">{money(room.agreed, room.currency)}</dd></div>
          <div><dt className="text-xs text-ink-muted">{t("Already invoiced")}</dt><dd className="font-semibold">{money(room.used, room.currency)}</dd></div>
          <div><dt className="text-xs text-ink-muted">{t("Left to invoice")}</dt><dd className="font-semibold">{money(left, room.currency)}</dd></div>
        </dl>
      </section>
      {error === "over" && <div className="mt-3"><Notice tone="error">{t("The amount is more than what is left to invoice.")}</Notice></div>}
      {error === "1" && <div className="mt-3"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}
      {room.status === "cancelled" || left <= 0 ? (
        <p className="card mt-3 p-4 text-sm text-ink-muted">{room.status === "cancelled" ? t("This job was cancelled.") : t("The whole agreed price is already invoiced.")}</p>
      ) : (
        <form action={createInvoice} className="card mt-3 space-y-4 p-4">
          <input type="hidden" name="job" value={job} />
          <Field label={t("Amount in USD")}><input name="amount" type="number" step="0.01" min="0.01" max={left} defaultValue={left} required className={inputClass} /></Field>
          <Field label={t("Due date")} optional={t("optional")}><input name="due" type="date" className={inputClass} /></Field>
          <Field label={t("Note")} optional={t("optional")} hint={t("For example: deposit, or final payment.")}><textarea name="note" rows={2} maxLength={500} className={inputClass} /></Field>
          <Button type="submit">{t("Send invoice")}</Button>
        </form>
      )}
    </main>
  );
}
