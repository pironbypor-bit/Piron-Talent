import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CheckCircle2, FileCheck, Gavel, MessageCircle, PackageCheck, Sparkles, Star, Tag, UserPlus, XCircle, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { markNotificationsRead } from "@/lib/app/actions";
import { listNotifications } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Notifications") };
}

// Every title the database writes, with an icon. Unknown titles fall back to the bell.
const ICONS: Record<string, LucideIcon> = {
  "New message": MessageCircle,
  "New comment": Sparkles,
  "New application": FileCheck,
  "New quote": Tag,
  "Quote accepted": CheckCircle2,
  "Quote declined": XCircle,
  "Work delivered": PackageCheck,
  "Job confirmed": CheckCircle2,
  "Job cancelled": XCircle,
  "New review": Star,
  "Dispute opened": Gavel,
  "Dispute reviewing": Gavel,
  "Dispute resolved": Gavel,
  "Dispute dismissed": Gavel,
  "Project invitation": UserPlus,
  "Identity checked": FileCheck,
  "Identity check rejected": FileCheck,
};

const GROUPS = ["Today", "This week", "Earlier"] as const;
type Group = (typeof GROUPS)[number];

/** Newest first, bucketed by age at the time of the request. */
async function loadGrouped() {
  const rows = await listNotifications(100);
  const now = Date.now();
  const groupOf = (iso: string): Group => {
    const age = now - new Date(iso).getTime();
    return age < 24 * 3600e3 ? "Today" : age < 7 * 24 * 3600e3 ? "This week" : "Earlier";
  };
  const grouped = GROUPS.map((g) => ({ g, items: rows.filter((r) => groupOf(r.created_at) === g) })).filter((x) => x.items.length > 0);
  return { rows, grouped };
}

/** The notification centre behind the bell: newest first, grouped by age; opening one marks it read. */
export default async function NotificationsPage() {
  const [t, locale, { rows, grouped }] = await Promise.all([getT(), getLocale(), loadGrouped()]);
  const unread = rows.filter((n) => !n.read_at).length;

  return (
    <main className="px-4 pb-24 pt-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("Notifications")}</h1>
          <p className="text-sm text-ink-muted">{unread > 0 ? t("{n} unread", { n: unread }) : t("All caught up.")}</p>
        </div>
        {unread > 0 && (
          <form action={markNotificationsRead}>
            <button type="submit" className="text-sm font-medium underline">{t("Mark all read")}</button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState illustration={<Bell className="mx-auto size-10 text-brand-400" />}>{t("Quotes, messages and job updates arrive here.")}</EmptyState>
        </div>
      ) : (
        grouped.map(({ g, items }) => (
          <section key={g} className="mt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t(g)}</h2>
            <ul className="card divide-y divide-stone-100">
              {items.map((n) => {
                const Icon = ICONS[n.title] ?? Bell;
                const fresh = !n.read_at;
                return (
                  <li key={n.id}>
                    <Link prefetch={false} href={`/app/notifications/go/${n.id}`} className={`flex items-start gap-3 px-3 py-3 hover:bg-stone-50 ${fresh ? "bg-brand-50/60" : ""}`}>
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${fresh ? "bg-brand-200 text-brand-900" : "bg-stone-100 text-ink-muted"}`}>
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${fresh ? "font-bold" : "font-medium"}`}>{t(n.title)}</span>
                        {n.body && <span className="block truncate text-sm text-ink-muted">{n.body}</span>}
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-ink-muted">{formatDate(n.created_at, locale)}</span>
                        {fresh && <span className="size-2 rounded-full bg-brand-500" aria-label={t("Unread")} />}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
