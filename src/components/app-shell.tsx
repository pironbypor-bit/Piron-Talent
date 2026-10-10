"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Briefcase, Home, LayoutGrid, MessageCircle, User } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { useT } from "@/lib/i18n/client";

// The app shell from docs/app-ui-plan.md section 3: a top bar and a five-tab bottom bar.
// `base` lets the same shell serve the demo (/demo/app) and later the real app (/).

const TABS = [
  { key: "", label: "Home", Icon: Home },
  { key: "services", label: "Services", Icon: LayoutGrid },
  { key: "jobs", label: "Jobs", Icon: Briefcase },
  { key: "messages", label: "Messages", Icon: MessageCircle },
  { key: "profile", label: "Profile", Icon: User },
];

export function TopBar({ base, name }: { base: string; name: string }) {
  const t = useT();
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
      <Link href={base} className="flex items-center gap-2 font-bold">
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-sm font-black text-ink" aria-hidden="true">
          P
        </span>
        {APP_NAME}
      </Link>
      <div className="flex items-center gap-3">
        <Link href={`${base}/profile#notifications`} aria-label={t("Notifications")} className="relative rounded-full p-1.5 hover:bg-stone-100">
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-500" aria-hidden="true" />
        </Link>
        <Link href={`${base}/profile`} aria-label={t("Profile")} className="flex size-8 items-center justify-center rounded-full bg-brand-200 text-sm font-bold text-brand-900">
          {name.charAt(0)}
        </Link>
      </div>
    </header>
  );
}

export function TabBar({ base }: { base: string }) {
  const t = useT();
  const path = usePathname();
  return (
    <nav className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]" aria-label={t("App preview")}>
      {TABS.map(({ key, label, Icon }) => {
        const href = key ? `${base}/${key}` : base;
        const active = key ? path.startsWith(href) : path === base;
        return (
          <Link key={key} href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-brand-700" : "text-ink-muted hover:text-ink"}`}>
            <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}
