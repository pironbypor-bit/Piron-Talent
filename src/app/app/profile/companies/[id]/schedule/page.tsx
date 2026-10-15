import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Field, Notice, Pill, inputClass } from "@/components/ui";
import { addTeamShift, clockShift, deleteTeamShift } from "@/lib/app/actions";
import { getBusiness, getMe, teamShifts } from "@/lib/app/queries";
import { addDays, mondayOf, phnomPenhToIso, ppTime, todayPP } from "@/lib/datetime";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { ShiftRow } from "@/lib/app/types";
import { Dropdown } from "@/components/dropdown";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ week?: string; error?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Schedule") };
}

const hours = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 3600000);
const hm = (h: number) => `${Math.floor(h)} h${Math.round((h % 1) * 60) ? ` ${Math.round((h % 1) * 60)} min` : ""}`;
const small = "rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium hover:bg-brand-50";

/** Weekly schedule. Owner and managers plan shifts and see everyone; a member sees their own and clocks in and out. */
export default async function SchedulePage({ params, searchParams }: Props) {
  const [{ id }, { week, error }, t, locale, me] = await Promise.all([params, searchParams, getT(), getLocale(), getMe()]);
  const b = await getBusiness(id);
  if (!b || !me) notFound();
  const manager = b.role === "owner" || b.role === "manager";
  const monday = mondayOf(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(week ?? "") ? week! : todayPP());
  const from = phnomPenhToIso(monday, "00:00")!;
  const to = phnomPenhToIso(addDays(monday, 7), "00:00")!;
  const shifts = await teamShifts(b.id, from, to);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const today = todayPP();
  const dayOf = (s: ShiftRow) => days.find((d) => phnomPenhToIso(d, "00:00")! <= s.starts_at && s.starts_at < phnomPenhToIso(addDays(d, 1), "00:00")!);
  const weekday = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString(locale === "km" ? "km-KH" : "en-GB", { weekday: "short", timeZone: "UTC" });

  const totals = new Map<string, { name: string; planned: number; worked: number }>();
  for (const s of shifts) {
    const row = totals.get(s.user_id) ?? { name: s.person, planned: 0, worked: 0 };
    if (!s.absent) row.planned += hours(s.starts_at, s.ends_at);
    if (s.clock_in_at && s.clock_out_at) row.worked += hours(s.clock_in_at, s.clock_out_at);
    totals.set(s.user_id, row);
  }
  const q = (w: string) => `/app/profile/companies/${b.id}/schedule?week=${w}`;

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href={`/app/profile/companies/${b.id}`} className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <h1 className="text-xl font-bold">{t("Schedule")}</h1>
        <p className="text-sm text-ink-muted">{b.name} · {manager ? t("Everyone in the team") : t("Your shifts")}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Link href={q(addDays(monday, -7))} className={small} aria-label={t("Previous week")}><ChevronLeft className="inline size-4" /></Link>
          <span className="text-sm font-semibold">{formatDate(days[0], locale)} – {formatDate(days[6], locale)}</span>
          <Link href={q(addDays(monday, 7))} className={small} aria-label={t("Next week")}><ChevronRight className="inline size-4" /></Link>
        </div>
      </section>

      {error === "overlap" && <div className="mt-3"><Notice tone="error">{t("That person already has a shift at this time.")}</Notice></div>}
      {error === "clock" && <div className="mt-3"><Notice tone="error">{t("You can clock in from 30 minutes before the shift until it ends.")}</Notice></div>}
      {error === "1" && <div className="mt-3"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}

      <ul className="mt-3 space-y-3">
        {days.map((d) => {
          const list = shifts.filter((s) => dayOf(s) === d);
          return (
            <li key={d} className={`card p-3 ${d === today ? "border-brand-400" : ""}`}>
              <p className="text-sm font-semibold">{weekday(d)} · {formatDate(d, locale)}{d === today ? ` · ${t("Today")}` : ""}</p>
              {list.length === 0 ? (
                <p className="mt-1 text-sm text-ink-muted">{t("No shifts.")}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {list.map((s) => {
                    const mine = s.user_id === me.id;
                    const act = (action: string) => clockShift.bind(null, b.id, s.id, action, monday);
                    return (
                      <li key={s.id} className="rounded-xl bg-stone-50 p-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{ppTime(s.starts_at)}–{ppTime(s.ends_at)}</span>
                          {manager && <span className="text-sm">{s.person}</span>}
                          {s.absent ? <Pill tone="red">{t("Absent")}</Pill>
                            : s.clock_out_at ? <Pill tone="green">{t("Worked")} {hm(hours(s.clock_in_at!, s.clock_out_at))}</Pill>
                            : s.clock_in_at ? <Pill tone="amber">{t("In since {time}", { time: ppTime(s.clock_in_at) })}</Pill>
                            : <Pill>{t("Planned")}</Pill>}
                        </div>
                        {s.note && <p className="mt-1 text-xs text-ink-muted">{s.note}</p>}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(mine || manager) && !s.absent && !s.clock_in_at && <form action={act("in")}><button type="submit" className={small}>{t("Clock in")}</button></form>}
                          {(mine || manager) && s.clock_in_at && !s.clock_out_at && <form action={act("out")}><button type="submit" className={small}>{t("Clock out")}</button></form>}
                          {(mine || manager) && !s.absent && !s.clock_out_at && <form action={act("absent")}><button type="submit" className={small}>{mine && !manager ? t("I cannot come") : t("Mark absent")}</button></form>}
                          {manager && (s.absent || s.clock_in_at) && <form action={act("reset")}><button type="submit" className={small}>{t("Reset")}</button></form>}
                          {manager && <form action={deleteTeamShift.bind(null, b.id, s.id, monday)}><button type="submit" className="text-xs underline">{t("Delete")}</button></form>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {manager && totals.size > 0 && (
        <section className="card mt-3 p-4">
          <h2 className="font-semibold">{t("Hours this week")}</h2>
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs text-ink-muted"><tr><th className="py-1 font-medium">{t("Person")}</th><th className="py-1 font-medium">{t("Planned")}</th><th className="py-1 font-medium">{t("Worked")}</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {[...totals.entries()].map(([uid, r]) => (
                <tr key={uid}><td className="py-1.5">{r.name}</td><td className="py-1.5">{hm(r.planned)}</td><td className="py-1.5">{hm(r.worked)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-muted">{t("Hours are a record. Use them when you add a pay record; nothing is paid or calculated here.")}</p>
        </section>
      )}

      {manager && (
        <section className="card mt-3 p-4">
          <h2 className="font-semibold">{t("Add a shift")}</h2>
          <form action={addTeamShift.bind(null, b.id)} className="mt-3 space-y-3">
            <Field label={t("Person")}>
              <Dropdown required name="person" defaultValue={b.team[0]?.user_id ?? ""} options={b.team.map((m) => ({ value: m.user_id, label: m.display_name + (m.job_title ? " · " + m.job_title : "") }))} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label={t("Date")}><input type="date" name="date" required defaultValue={today >= days[0] && today <= days[6] ? today : days[0]} className={inputClass} /></Field>
              <Field label={t("Start")}><input type="time" name="start" required defaultValue="08:00" className={inputClass} /></Field>
              <Field label={t("End")}><input type="time" name="end" required defaultValue="16:00" className={inputClass} /></Field>
            </div>
            <Field label={t("Note")} optional={t("optional")}><input name="note" maxLength={200} className={inputClass} /></Field>
            <Button type="submit" className="px-4 py-2 text-sm">{t("Add shift")}</Button>
          </form>
        </section>
      )}
    </main>
  );
}
