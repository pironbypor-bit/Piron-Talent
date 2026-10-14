import type { Signals } from "@/lib/app/types";
import type { T } from "@/lib/i18n/core";

export const isAvailableNow = (s: Pick<Signals, "available_until">) => !!s.available_until && new Date(s.available_until) > new Date();

/** "Replies within a day" style line, only once there is something to measure. */
export function replyText(t: T, s: Pick<Signals, "reply_minutes" | "replies">): string | null {
  if (s.replies < 2 || s.reply_minutes === null) return null;
  const h = s.reply_minutes / 60;
  if (h <= 1) return t("Replies within an hour");
  if (h <= 24) return t("Replies within a day");
  if (h <= 72) return t("Replies within 3 days");
  return t("Slow to reply");
}

export function AvailablePill({ s, t }: { s: Pick<Signals, "available_until">; t: T }) {
  if (!isAvailableNow(s)) return null;
  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">{t("Available this week")}</span>;
}
