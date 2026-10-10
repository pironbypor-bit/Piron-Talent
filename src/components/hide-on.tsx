"use client";

import { usePathname } from "next/navigation";

/** Renders nothing under the given path prefixes: the app has its own shell, so the site header and footer stay out. */
export function HideOn({ prefixes, children }: { prefixes: string[]; children: React.ReactNode }) {
  const path = usePathname();
  if (prefixes.some((p) => path === p || path.startsWith(p + "/"))) return null;
  return <>{children}</>;
}
