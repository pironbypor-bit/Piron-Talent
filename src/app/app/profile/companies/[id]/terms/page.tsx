import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { Button, Notice, Pill, inputClass } from "@/components/ui";
import { addPayRecord, deletePayRecord, markPayPaid, setMemberTerms } from "@/lib/app/actions";
import { businessPay, businessTerms, getBusiness, getMe, teamShifts } from "@/lib/app/queries";
import { addDays, phnomPenhToIso, ppDate, todayPP } from "@/lib/datetime";
import type { MemberTerms, PayRecordRow, RateUnit } from "@/lib/app/types";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../../../avatar";
import { Dropdown } from "@/components/dropdown";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string; to?: string }> };
const isDay = (v?: string) => !!v && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Terms and pay") };
}

const UNIT: Record<RateUnit, string> = { hour: "per hour", day: "per day", month: "per month" };
const QTY: Record<RateUnit, string> = { hour: "Hours worked", day: "Days worked", month: "Months" };
const money = (n: number) => `$${n.toFixed(2)}`;

/** Private to the owner and the person: terms of work and pay records. Nothing here is public or shown to other members. */
export default async function TermsPage({ params, searchParams }: Props) {
  const [{ id }, sp, t, locale, me] = await Promise.all([params, searchParams, getT(), getLocale(), getMe()]);
  const b = await getBusiness(id);
  if (!b || !me) notFound();
  const owner = b.role === "owner";
  const [terms, pay] = await Promise.all([businessTerms(id), businessPay(id)]);
  const termsOf = (uid: string): MemberTerms | undefined => terms.find((x) => x.user_id === uid);
  const people = owner ? b.team.filter((m) => m.role !== "owner") : b.team.filter((m) => m.user_id === me.id);
  const today = new Date().toISOString().slice(0, 10);
  // Worked hours from the schedule (clocked shifts) for the chosen period; they only prefill the form, the owner decides.
  const periodTo = isDay(sp.to) ? sp.to! : todayPP();
  const periodFrom = isDay(sp.from) ? sp.from! : addDays(periodTo, -29);
  const worked = new Map<string, { hours: number; days: Set<string> }>();
  if (owner) {
    const shifts = await teamShifts(id, phnomPenhToIso(periodFrom, "00:00")!, phnomPenhToIso(addDays(periodTo, 1), "00:00")!);
    for (const sh of shifts) {
      if (!sh.clock_in_at || !sh.clock_out_at) continue;
      const w = worked.get(sh.user_id) ?? { hours: 0, days: new Set<string>() };
      w.hours += (new Date(sh.clock_out_at).getTime() - new Date(sh.clock_in_at).getTime()) / 3600000;
      w.days.add(ppDate(sh.starts_at));
      worked.set(sh.user_id, w);
    }
  }

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href={`/app/profile/companies/${id}`} className="text-sm font-medium underline">{t("Back")}</Link>
      <h1 className="mt-3 text-2xl font-bold">{t("Terms and pay")}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><Lock className="size-4" />{owner ? t("Only you and each person see their own terms and pay.") : t("Only you and the owner see this.")}</p>
      <div className="mt-3"><Notice tone="info">{t("Piron Work does not move money. It records the hours, the rate and what you paid, so both sides see the same numbers.")}</Notice></div>

      {owner && (
        <form method="get" className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-stone-200 p-3">
          <label className="text-xs text-ink-muted">{t("From")}<input type="date" name="from" defaultValue={periodFrom} className={`${inputClass} mt-1 py-1.5 text-sm`} /></label>
          <label className="text-xs text-ink-muted">{t("To")}<input type="date" name="to" defaultValue={periodTo} className={`${inputClass} mt-1 py-1.5 text-sm`} /></label>
          <Button type="submit" variant="secondary" className="px-3 py-2 text-sm">{t("Show worked hours")}</Button>
          <p className="w-full text-xs text-ink-muted">{t("Hours come from the Schedule, from shifts that were clocked in and out. They only fill the form below.")}</p>
        </form>
      )}

      {people.length === 0 && <p className="mt-4 text-sm text-ink-muted">{t("No team members yet.")}</p>}

      {people.map((m) => {
        const tm = termsOf(m.user_id);
        const mine = pay.filter((r: PayRecordRow) => r.user_id === m.user_id);
        const owed = mine.filter((r) => r.status === "owed").reduce((n, r) => n + r.amount, 0);
        const unit: RateUnit = tm?.rate_unit ?? "hour";
        const w = worked.get(m.user_id);
        const suggest = !w ? "" : unit === "hour" ? String(Math.max(0.5, Math.round(w.hours * 2) / 2)) : unit === "day" ? String(Math.max(1, w.days.size)) : "";
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
                  <Dropdown name="rate_unit" className="flex-1" defaultValue={unit} label={t("Rate")} options={[{ value: "hour", label: t("per hour") }, { value: "day", label: t("per day") }, { value: "month", label: t("per month") }]} />
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
                <label className="text-xs text-ink-muted">{t("From")}<input type="date" name="from" required defaultValue={periodFrom} className={`${inputClass} mt-1 py-1.5 text-sm`} /></label>
                <label className="text-xs text-ink-muted">{t("To")}<input type="date" name="to" required defaultValue={periodTo} className={`${inputClass} mt-1 py-1.5 text-sm`} /></label>
                <label className="text-xs text-ink-muted">{t(QTY[unit])}<input type="number" name="quantity" step="0.5" min="0.5" required defaultValue={suggest} className={`${inputClass} mt-1 w-24 py-1.5 text-sm`} /></label>
                <input name="note" maxLength={300} placeholder={t("Note")} className={`${inputClass} min-w-0 flex-1 py-1.5 text-sm`} />
                <Button type="submit" className="px-3 py-2 text-sm" disabled={tm?.rate == null}>{t("Add pay record")}</Button>
                {tm?.rate == null && <p className="w-full text-xs text-ink-muted">{t("Save a rate first.")}</p>}
                {w && <p className="w-full text-xs text-ink-muted">{t("From the schedule: {h} h on {d} days in this period.", { h: w.hours.toFixed(1), d: w.days.size })}</p>}
              </form>
            )}
          </section>
        );
      })}
    </main>
  );
}
