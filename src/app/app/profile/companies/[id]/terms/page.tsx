import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { Button, Notice, Pill, inputClass } from "@/components/ui";
import { addPayRecord, deletePayRecord, markPayPaid, setMemberTerms } from "@/lib/app/actions";
import { businessPay, businessTerms, getBusiness, getMe } from "@/lib/app/queries";
import type { MemberTerms, PayRecordRow, RateUnit } from "@/lib/app/types";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../../../avatar";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Terms and pay") };
}

const UNIT: Record<RateUnit, string> = { hour: "per hour", day: "per day", month: "per month" };
const QTY: Record<RateUnit, string> = { hour: "Hours worked", day: "Days worked", month: "Months" };
const money = (n: number) => `$${n.toFixed(2)}`;

/** Private to the owner and the person: terms of work and pay records. Nothing here is public or shown to other members. */
export default async function TermsPage({ params }: Props) {
  const [{ id }, t, locale, me] = await Promise.all([params, getT(), getLocale(), getMe()]);
  const b = await getBusiness(id);
  if (!b || !me) notFound();
  const owner = b.role === "owner";
  const [terms, pay] = await Promise.all([businessTerms(id), businessPay(id)]);
  const termsOf = (uid: string): MemberTerms | undefined => terms.find((x) => x.user_id === uid);
  const people = owner ? b.team.filter((m) => m.role !== "owner") : b.team.filter((m) => m.user_id === me.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href={`/app/profile/companies/${id}`} className="text-sm font-medium underline">{t("Back")}</Link>
      <h1 className="mt-3 text-2xl font-bold">{t("Terms and pay")}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><Lock className="size-4" />{owner ? t("Only you and each person see their own terms and pay.") : t("Only you and the owner see this.")}</p>
      <div className="mt-3"><Notice tone="info">{t("Piron Work does not move money. It records the hours, the rate and what you paid, so both sides see the same numbers.")}</Notice></div>

      {people.length === 0 && <p className="mt-4 text-sm text-ink-muted">{t("No team members yet.")}</p>}

      {people.map((m) => {
        const tm = termsOf(m.user_id);
        const mine = pay.filter((r: PayRecordRow) => r.user_id === m.user_id);
        const owed = mine.filter((r) => r.status === "owed").reduce((n, r) => n + r.amount, 0);
        const unit: RateUnit = tm?.rate_unit ?? "hour";
        return (
          <section key={m.user_id} className="card mt-4 p-4">
            <div className="flex items-center gap-3">
              <AvatarImg name={m.display_name} url={m.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.display_name}</p>
                <p className="text-sm text-ink-muted">{tm?.job_title ?? t("No job title yet")}{tm?.starts_on ? ` · ${t("since {when}", { when: formatDate(tm.starts_on, locale) })}` : ""}</p>
              </div>
              {owed > 0 && <Pill tone="amber">{t("Owed")} {money(owed)}</Pill>}
            </div>

            {owner ? (
              <form action={setMemberTerms.bind(null, id, m.user_id)} className="mt-3 space-y-2">
                <input name="job_title" defaultValue={tm?.job_title ?? ""} maxLength={80} placeholder={t("Job title")} className={inputClass} />
                <textarea name="duties" defaultValue={tm?.duties ?? ""} maxLength={1000} rows={3} placeholder={t("Duties: one line each")} className={inputClass} />
                <div className="flex gap-2">
                  <input name="rate" type="number" step="0.01" min="0" defaultValue={tm?.rate ?? ""} placeholder={t("Rate")} className={`${inputClass} w-28`} />
                  <select name="rate_unit" defaultValue={unit} className={`${inputClass} flex-1`}>
                    <option value="hour">{t("per hour")}</option>
                    <option value="day">{t("per day")}</option>
                    <option value="month">{t("per month")}</option>
                  </select>
                  <Button type="submit" className="px-4 py-2 text-sm">{t("Save terms")}</Button>
                </div>
              </form>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                {tm?.duties ? <p className="whitespace-pre-wrap">{tm.duties}</p> : <p className="text-ink-muted">{t("No duties written yet.")}</p>}
                {tm?.rate !== null && tm?.rate !== undefined && <p className="font-semibold">{money(tm.rate)} {t(UNIT[unit])}</p>}
              </div>
            )}

            <h3 className="mt-4 text-sm font-semibold text-ink-muted">{t("Pay records")}</h3>
            {mine.length === 0 ? (
              <p className="mt-1 text-sm text-ink-muted">{t("Nothing recorded yet.")}</p>
            ) : (
              <ul className="mt-1 divide-y divide-stone-100">
                {mine.map((r) => (
                  <li key={r.id} className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block font-medium">{formatDate(r.period_from, locale)} – {formatDate(r.period_to, locale)}</span>
                        <span className="text-xs text-ink-muted">{r.quantity} × {money(r.rate)} {t(UNIT[r.unit])}{r.note ? ` · ${r.note}` : ""}</span>
                      </span>
                      <span className="text-right">
                        <span className="block font-bold">{money(r.amount)}</span>
                        <Pill tone={r.status === "paid" ? "green" : "amber"}>{r.status === "paid" ? `${t("Paid")} ${r.paid_on ? formatDate(r.paid_on, locale) : ""}` : t("Owed")}</Pill>
                      </span>
                    </div>
                    {owner && r.status === "owed" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <form action={markPayPaid.bind(null, id, r.id)} className="flex flex-wrap items-center gap-2">
                          <input type="date" name="paid_on" defaultValue={today} className={`${inputClass} w-auto py-1 text-xs`} aria-label={t("Paid on")} />
                          <input name="note" maxLength={300} placeholder={t("Cash, bank…")} className={`${inputClass} w-32 py-1 text-xs`} />
                          <Button type="submit" className="px-3 py-1.5 text-xs">{t("Mark as paid")}</Button>
                        </form>
                        <form action={deletePayRecord.bind(null, id, r.id)}>
                          <button type="submit" className="text-xs text-ink-muted underline">{t("Delete")}</button>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {owner && (
              <form action={addPayRecord.bind(null, id, m.user_id)} className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-stone-50 p-3">
                <label className="text-xs text-ink-muted">{t("From")}<input type="date" name="from" required defaultValue={today} className={`${inputClass} mt-1 py-1.5 text-sm`} /></label>
                <label className="text-xs text-ink-muted">{t("To")}<input type="date" name="to" required defaultValue={today} className={`${inputClass} mt-1 py-1.5 text-sm`} /></label>
                <label className="text-xs text-ink-muted">{t(QTY[unit])}<input type="number" name="quantity" step="0.5" min="0.5" required className={`${inputClass} mt-1 w-24 py-1.5 text-sm`} /></label>
                <input name="note" maxLength={300} placeholder={t("Note")} className={`${inputClass} min-w-0 flex-1 py-1.5 text-sm`} />
                <Button type="submit" className="px-3 py-2 text-sm" disabled={tm?.rate == null}>{t("Add pay record")}</Button>
                {tm?.rate == null && <p className="w-full text-xs text-ink-muted">{t("Save a rate first.")}</p>}
              </form>
            )}
          </section>
        );
      })}
    </main>
  );
}
