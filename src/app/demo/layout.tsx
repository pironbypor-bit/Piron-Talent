import Link from "next/link";
import { getT } from "@/lib/i18n/server";

/** Every demo page carries the same honest ribbon and the preview's navigation. */
export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  const items: [string, string][] = [
    ["/demo", t("Overview")],
    ["/demo/projects", t("Projects")],
    ["/demo/workspace", t("Workspace")],
    ["/demo/providers", t("Providers")],
    ["/demo/messages", t("Messages")],
    ["/demo/dashboard", t("Dashboard")],
    ["/demo/app", t("App preview")],
  ];
  return (
    <div>
      <div className="border-b border-brand-200 bg-brand-50">
        <div className="mx-auto max-w-3xl px-4 py-2 text-sm">
          <p className="text-brand-900">
            <span className="mr-2 rounded bg-brand-500 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-ink">{t("Sample")}</span>
            {t("Demo with sample data. Nobody here is a real person and no job is real.")}
          </p>
          <nav className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-medium">
            {items.map(([href, label]) => (
              <Link key={href} href={href} className="hover:underline">
                {label}
              </Link>
            ))}
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
