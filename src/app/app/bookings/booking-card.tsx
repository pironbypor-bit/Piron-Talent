import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { answerBooking, answerCounter, cancelBooking } from "@/lib/app/actions";
import { inputClass } from "@/components/ui";
import { AvatarImg } from "../avatar";
import { ppDate, ppTime } from "@/lib/datetime";
import type { BookingRow, BookingStatus } from "@/lib/app/types";
import type { T } from "@/lib/i18n/core";

const TONE: Record<BookingStatus, string> = {
  requested: "bg-amber-100 text-amber-900",
  countered: "bg-blue-100 text-blue-900",
  accepted: "bg-green-100 text-green-900",
  declined: "bg-red-100 text-red-900",
  cancelled: "bg-stone-200 text-ink-muted",
  expired: "bg-stone-200 text-ink-muted",
};
const usd = (n: number) => `$${Number(n).toFixed(2)}`;
const btn = "rounded-xl px-3 py-1.5 text-sm font-semibold";

/** One booking, with the buttons that fit who is looking and what state it is in. */
export function BookingCard({ r, t }: { r: BookingRow; t: T }) {
  const label: Record<BookingStatus, string> = {
    requested: r.mine === "provider" ? t("Needs your answer") : t("Waiting for the provider"),
    countered: r.mine === "customer" ? t("The provider suggested a change") : t("Waiting for the customer"),
    accepted: t("Agreed"),
    declined: t("Declined"),
    cancelled: t("Cancelled"),
    expired: t("Expired"),
  };
  const when = r.requested_start ? `${ppDate(r.requested_start)} ${ppTime(r.requested_start)}` : null;
  const counterWhen = r.counter_start ? `${ppDate(r.counter_start)} ${ppTime(r.counter_start)}` : null;
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <AvatarImg name={r.other.display_name} url={r.other.avatar_url} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{r.mine === "customer" ? t("You booked") : t("Booking request for you")}</p>
          <p className="truncate font-semibold">{r.other.display_name}</p>
          <p className="mt-0.5 break-words text-sm">{r.details}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
            {when && <span className="inline-flex items-center gap-1"><CalendarClock className="size-3" />{when}</span>}
            {r.place && <span>{r.place}</span>}
            {r.budget !== null && <span>{t("Budget")} {usd(r.budget)}</span>}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[r.status]}`}>{label[r.status]}</span>
      </div>

      {r.status === "countered" && (
        <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm">
          <p className="font-semibold">{t("Suggested change")}</p>
          <p>{r.counter_price !== null ? `${t("Price")}: ${usd(r.counter_price)}` : ""}{r.counter_price !== null && counterWhen ? " · " : ""}{counterWhen ? `${t("Time")}: ${counterWhen}` : ""}</p>
          {r.mine === "customer" && (
            <div className="mt-2 flex flex-wrap gap-2">
              <form action={answerCounter.bind(null, r.id, true)}><button className={`${btn} bg-brand-500 text-ink hover:bg-brand-400`}>{t("Accept the change")}</button></form>
              <form action={answerCounter.bind(null, r.id, false)}><button className={`${btn} border border-stone-300 bg-white hover:bg-brand-50`}>{t("Decline")}</button></form>
            </div>
          )}
        </div>
      )}

      {r.status === "requested" && r.mine === "provider" && (
        <form action={answerBooking.bind(null, r.id)} className="mt-3 space-y-2 rounded-xl bg-stone-50 p-3">
          <label className="block text-xs font-semibold text-ink-muted">
            {t("Your price (USD)")}
            <input name="price" inputMode="decimal" defaultValue={r.budget ?? ""} placeholder="0.00" className={`${inputClass} mt-1`} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-ink-muted">{t("Another date")}<input type="date" name="date" className={`${inputClass} mt-1`} /></label>
            <label className="block text-xs font-semibold text-ink-muted">{t("Another time")}<input type="time" name="time" className={`${inputClass} mt-1`} /></label>
          </div>
          <label className="block text-xs font-semibold text-ink-muted">
            {t("Reason (if you decline)")}
            <input name="reason" maxLength={200} className={`${inputClass} mt-1`} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button name="action" value="accept" className={`${btn} bg-brand-500 text-ink hover:bg-brand-400`}>{t("Accept")}</button>
            <button name="action" value="counter" className={`${btn} border border-stone-300 bg-white hover:bg-brand-50`}>{t("Suggest another price or time")}</button>
            <button name="action" value="decline" className={`${btn} border border-stone-300 bg-white text-red-700 hover:bg-red-50`}>{t("Decline")}</button>
          </div>
          <p className="text-[11px] text-ink-muted">{t("Unanswered requests close after 48 hours.")}</p>
        </form>
      )}

      {r.status === "declined" && r.decline_reason && <p className="mt-2 text-sm text-ink-muted">{r.decline_reason}</p>}
      {r.status === "accepted" && r.post_id && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold">{r.agreed_price !== null ? usd(r.agreed_price) : ""}</span>
          <Link href={`/app/post/${r.post_id}`} className="rounded-xl bg-brand-500 px-3 py-1.5 font-semibold text-ink hover:bg-brand-400">{t("Open the job")}</Link>
        </div>
      )}
      {r.mine === "customer" && (r.status === "requested" || r.status === "countered") && (
        <form action={cancelBooking.bind(null, r.id)} className="mt-3">
          <button className={`${btn} border border-stone-300 bg-white hover:bg-brand-50`}>{t("Cancel this request")}</button>
        </form>
      )}
    </article>
  );
}
