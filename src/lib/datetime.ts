import type { Locale } from "@/lib/i18n/core";
import { formatDate } from "@/lib/dates";

// Cambodia is UTC+7 all year. Activities are entered and shown in that time zone, whatever the server or phone uses.
const OFFSET_MS = 7 * 3600 * 1000;

/** "2026-10-18" + "08:30" typed in Phnom Penh time → ISO timestamp for the database. Null when invalid. */
export function phnomPenhToIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const parts = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return { date: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`, time: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` };
};

/** "18 Oct 2026 · 08:30–11:00" (or with the end date when it passes midnight). */
export function formatRange(startIso: string, endIso: string, locale: Locale): string {
  const s = parts(startIso);
  const e = parts(endIso);
  const day = formatDate(s.date, locale);
  return s.date === e.date ? `${day} · ${s.time}–${e.time}` : `${day} ${s.time} – ${formatDate(e.date, locale)} ${e.time}`;
}

/** Phnom Penh calendar date and clock time of an instant: "2026-10-18" and "08:30". */
export const ppDate = (iso: string) => parts(iso).date;
export const ppTime = (iso: string) => parts(iso).time;
export const todayPP = () => parts(new Date().toISOString()).date;

const pad2 = (n: number) => String(n).padStart(2, "0");
/** Add days to a YYYY-MM-DD date string. */
export function addDays(date: string, n: number): string {
  const x = new Date(date + "T00:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return `${x.getUTCFullYear()}-${pad2(x.getUTCMonth() + 1)}-${pad2(x.getUTCDate())}`;
}
/** The Monday of the week that holds the date. */
export function mondayOf(date: string): string {
  const x = new Date(date + "T00:00:00Z");
  return addDays(date, -((x.getUTCDay() + 6) % 7));
}
