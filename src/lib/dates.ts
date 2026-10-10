import type { Locale } from "@/lib/i18n/core";

// Month names written out so dates look the same on the laptop, on the phone and on the Cloudflare Worker,
// whose runtime has no Khmer locale data for Intl.
const MONTHS: Record<Locale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  km: ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"],
};

/** "2 Feb 2027" or "2 កុម្ភៈ 2027". Accepts an ISO timestamp or a YYYY-MM-DD date. */
export function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[locale][d.getMonth()]} ${d.getFullYear()}`;
}
