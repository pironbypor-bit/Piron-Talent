import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { T } from "@/lib/i18n/core";

export type Group = "waiting" | "active" | "done" | "cancelled";
export type Item = {
  key: string;
  type: "booking" | "job" | "application" | "quote";
  group: Group;
  title: string;
  who: string | null;
  when: string;
  label: string;
  href: string | null;
  amount?: string;
  hireAgain?: string;
};

const TONE: Record<Group, string> = { waiting: "bg-amber-100 text-amber-900", active: "bg-blue-100 text-blue-900", done: "bg-green-100 text-green-900", cancelled: "bg-stone-200 text-ink-muted" };

/** One row of the Bookings list for things that have no buttons of their own (jobs, applications, quotes). */
export function ItemRow({ i, t }: { i: Item; t: T }) {
  const kind = { booking: t("Booking"), job: t("Job"), application: t("Job application"), quote: t("Quote") }[i.type];
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{kind}</p>
        <p className="truncate font-semibold">{i.title}</p>
        {i.who && <p className="truncate text-xs text-ink-muted">{i.who}</p>}
        <p className="mt-0.5 text-xs text-ink-muted">{i.when}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[i.group]}`}>{i.label}</span>
        {i.amount && <span className="text-sm font-bold">{i.amount}</span>}
      </div>
      {i.href && <ChevronRight className="size-4 shrink-0 text-ink-muted" />}
    </>
  );
  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      {i.href ? <Link href={i.href} className="flex items-center gap-3 p-3 hover:bg-brand-50">{inner}</Link> : <div className="flex items-center gap-3 p-3">{inner}</div>}
      {i.hireAgain && <Link href={i.hireAgain} className="block border-t border-stone-100 px-3 py-2 text-sm font-medium underline">{t("Hire again")}</Link>}
    </div>
  );
}
