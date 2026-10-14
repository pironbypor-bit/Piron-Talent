"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Briefcase, Home, LayoutGrid, LogOut, Menu, MessageCircle, PlusSquare, Settings } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { useT } from "@/lib/i18n/client";
import { BrandMark } from "./brand";
import { useLiveCounts } from "./live-counts";

/* eslint-disable @next/next/no-img-element */

// The app shell from docs/app-ui-plan.md section 3: a top bar and a five-tab bottom bar.
// Owner decision 2026-10-14 (profile design A): the avatar in the top bar is the Profile button, a menu next to the
// bell holds Notifications, Settings and Log out, and the fifth tab is Post.
// `base` lets the same shell serve the demo (/demo/app) and the real app (/app).

const TABS = [
  { key: "", label: "Home", Icon: Home },
  { key: "services", label: "Services", Icon: LayoutGrid },
  { key: "jobs", label: "Jobs", Icon: Briefcase },
  { key: "messages", label: "Messages", Icon: MessageCircle },
  { key: "post/new", label: "Post", Icon: PlusSquare },
];

/** The menu next to the bell: Notifications, Settings, Log out (the real app passes its server action). */
function TopMenu({ base, notificationsHref, logOut }: { base: string; notificationsHref: string; logOut?: () => Promise<void> }) {
  const t = useT();
  const item = "flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-brand-50";
  return (
    <details className="relative">
      <summary aria-label={t("Menu")} className="flex cursor-pointer list-none items-center rounded-full p-2 hover:bg-brand-50 [&::-webkit-details-marker]:hidden">
        <Menu className="size-5" />
      </summary>
      <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 shadow-lg">
        <Link href={notificationsHref} className={item}><Bell className="size-4 text-ink-muted" />{t("Notifications")}</Link>
        <Link href={`${base}/settings`} className={item}><Settings className="size-4 text-ink-muted" />{t("Settings")}</Link>
        {logOut && (
          <form action={logOut}>
            <button type="submit" className={item}><LogOut className="size-4 text-ink-muted" />{t("Log out")}</button>
          </form>
        )}
      </div>
    </details>
  );
}

export function TopBar({ base, name, unread = 1, signedIn = true, avatarUrl = null, notificationsHref, logOut }: { base: string; name: string; unread?: number; signedIn?: boolean; avatarUrl?: string | null; notificationsHref?: string; logOut?: () => Promise<void> }) {
  const t = useT();
  const live = useLiveCounts();
  const n = live?.unread ?? unread;
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-100 bg-white/90 px-4 py-2.5 backdrop-blur">
      <Link href={base} className="flex items-center gap-2 font-bold tracking-tight">
        <BrandMark className="size-8" />
        {APP_NAME}
      </Link>
      <div className="flex items-center gap-2">
        <Link href={notificationsHref ?? `${base}/profile#notifications`} aria-label={t("Notifications")} className="relative rounded-full p-2 hover:bg-brand-50">
          <Bell className="size-5" />
          {n > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-ink">
              {n > 9 ? "9+" : n}
            </span>
          )}
        </Link>
        {signedIn && <TopMenu base={base} notificationsHref={notificationsHref ?? `${base}/profile#notifications`} logOut={logOut} />}
        {signedIn ? (
          <Link href={`${base}/profile`} aria-label={t("Profile")} className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-brand-200 text-sm font-bold text-brand-900 ring-2 ring-white">
            {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : name.charAt(0) || "?"}
          </Link>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(base + "/profile")}`} className="rounded-full bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-brand-400">
            {t("Log in")}
          </Link>
        )}
      </div>
    </header>
  );
}

export function TabBar({ base }: { base: string }) {
  const t = useT();
  const path = usePathname();
  const live = useLiveCounts();
  const badge = (key: string) => (key === "messages" ? live?.unreadMessages ?? 0 : 0);
  return (
    <nav className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label={t("App preview")}>
      {TABS.map(({ key, label, Icon }) => {
        const href = key ? `${base}/${key}` : base;
        const active = key ? path.startsWith(href) : path === base;
        return (
          <Link key={key} href={href} aria-current={active ? "page" : undefined} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-brand-700" : "text-ink-muted hover:text-ink"}`}>
            {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-500" aria-hidden="true" />}
            <span className={`relative rounded-xl px-3 py-0.5 ${active ? "bg-brand-100" : ""}`}>
              <Icon className="size-5" strokeWidth={active ? 2.5 : 2} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
              {badge(key) > 0 && (
                <span className="absolute -top-1 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-ink">
                  {badge(key) > 9 ? "9+" : badge(key)}
                </span>
              )}
            </span>
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}
