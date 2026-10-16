import Link from "next/link";
import type { T } from "@/lib/i18n/core";

export type HomePage = "posts" | "professionals" | "bookings";

/** The three buttons at the top of Home (feature switch home_pages). The chosen one is dark. */
export function HomeStrip({ current, t, badge = 0 }: { current: HomePage; t: T; badge?: number }) {
  const items: { key: HomePage; href: string; label: string }[] = [
    { key: "posts", href: "/app", label: t("Posts") },
    { key: "professionals", href: "/app/professionals", label: t("Professionals") },
    { key: "bookings", href: "/app/bookings", label: t("Bookings") },
  ];
  return (
    <nav aria-label={t("Home pages")} className="mb-4 flex gap-2">
      {items.map((i) => (
        <Link
          key={i.key}
          href={i.href}
          aria-current={current === i.key ? "page" : undefined}
          className={`relative flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold ${current === i.key ? "bg-ink text-white" : "border border-stone-300 bg-white hover:bg-brand-50"}`}
        >
          {i.label}
          {i.key === "bookings" && badge > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-ink">{badge > 9 ? "9+" : badge}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
