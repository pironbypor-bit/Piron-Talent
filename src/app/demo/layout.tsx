import Link from "next/link";
import { getT } from "@/lib/i18n/server";

/** Every demo page carries the same honest ribbon and a small sub-navigation. */
export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div>
      <div className="border-b border-brand-200 bg-brand-50">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 text-sm">
          <p className="text-brand-900">
            <span className="mr-2 rounded bg-brand-500 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-ink">{t("Sample")}</span>
            {t("Demo with sample data. Nobody here is a real person and no job is real.")}
          </p>
          <nav className="flex gap-4 font-medium">
            <Link href="/demo" className="hover:underline">
              {t("Overview")}
            </Link>
            <Link href="/demo/project" className="hover:underline">
              {t("Project page")}
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
