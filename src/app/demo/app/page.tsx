import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getLocale, getT } from "@/lib/i18n/server";
import { Board } from "../workspace/board";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Workspace") };
}

/** Home tab: the Workspace board inside the app shell. */
export default async function AppHome() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="px-4 py-4">
      <label className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-ink-muted">
        <Search className="size-4" aria-hidden="true" />
        <input className="w-full bg-transparent outline-none placeholder:text-stone-400" placeholder={t("Search posts")} aria-label={t("Search posts")} />
      </label>
      <div className="mt-4">
        <Board locale={locale} compact />
      </div>
    </main>
  );
}
