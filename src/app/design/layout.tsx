import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Design", robots: { index: false, follow: false } };

/** Internal: homepage proposals for the owner to compare. Not linked from the site, not indexed. */
export default async function DesignLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div>
      <div className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-sm">
          <p className="text-ink-muted">{t("Not public. Two homepage proposals for review.")}</p>
          <nav className="flex gap-4 font-medium">
            <Link href="/design/home-a" className="hover:underline">
              A
            </Link>
            <Link href="/design/home-b" className="hover:underline">
              B
            </Link>
            <Link href="/" className="text-ink-muted hover:underline">
              {t("Back to site")}
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
