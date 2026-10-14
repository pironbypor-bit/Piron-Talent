"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Small bar to flip between the two profile demos. */
export function DemoCompare() {
  const path = usePathname();
  const item = (href: string, label: string) => (
    <Link href={href} aria-current={path === href ? "page" : undefined} className={`rounded-full px-3 py-1 text-xs font-semibold ${path === href ? "bg-ink text-white" : "bg-white text-ink"}`}>
      {label}
    </Link>
  );
  return (
    <div className="mb-3 flex items-center gap-2 rounded-2xl bg-stone-200 p-1.5 text-xs">
      <span className="px-1 text-ink-muted">Demo</span>
      {item("/demo/app/profile-a", "A · Cards")}
      {item("/demo/app/profile-b", "B · Switcher")}
    </div>
  );
}
