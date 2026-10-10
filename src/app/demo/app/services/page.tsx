import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, FileText, Laptop, MoreHorizontal, Palette, Scale, Search, Sparkles, Wrench } from "lucide-react";
import { Pill } from "@/components/ui";
import { RATES } from "@/lib/demo/app-fixtures";
import { pick, providers } from "@/lib/demo/fixtures";
import { getLocale, getT } from "@/lib/i18n/server";
import { Avatar, Stars } from "../../demo-ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Services") };
}

const TILES = [
  { label: "Finance", Icon: Calculator, review: false },
  { label: "Documents", Icon: FileText, review: false },
  { label: "Legal", Icon: Scale, review: true },
  { label: "IT", Icon: Laptop, review: false },
  { label: "Technical", Icon: Wrench, review: true },
  { label: "Beauty", Icon: Sparkles, review: false },
  { label: "Creative", Icon: Palette, review: false },
  { label: "More", Icon: MoreHorizontal, review: false },
];

/** Services tab: category grid, then providers with a starting price and one action. */
export default async function AppServices() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  return (
    <main className="px-4 py-4">
      <h1 className="text-xl font-bold">{t("Find professional services")}</h1>
      <p className="text-sm text-ink-muted">{t("Skilled people. Checked identity. Phnom Penh.")}</p>
      <label className="mt-3 flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-ink-muted">
        <Search className="size-4" aria-hidden="true" />
        <input className="w-full bg-transparent outline-none placeholder:text-stone-400" placeholder={t("Search services")} aria-label={t("Search services")} />
      </label>

      <ul className="mt-4 grid grid-cols-4 gap-2">
        {TILES.map(({ label, Icon, review }) => (
          <li key={label}>
            <Link href="/demo/providers" className={`flex flex-col items-center gap-1 rounded-2xl bg-white px-1 py-3 text-center text-xs font-medium shadow-sm ${review ? "opacity-60" : "hover:bg-brand-50"}`}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                <Icon className="size-5" />
              </span>
              {t(label)}
              {review && <span className="text-[10px] font-normal text-ink-muted">{t("After review")}</span>}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("Popular providers")}</h2>
        <Link href="/demo/providers" className="text-sm font-medium text-brand-800 underline">
          {t("See all")}
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {providers.map((p) => {
          const name = pick(p.name, locale);
          return (
            <li key={p.slug} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <Avatar name={name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{pick(p.role, locale)}</p>
                <p className="truncate text-sm text-ink-muted">{name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                  <Stars rating={p.rating} />
                  <Pill tone="green">{t("Identity checked")}</Pill>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{pick(RATES[p.slug], locale)}</p>
                <Link href={`/demo/providers/${p.slug}`} className="mt-1 inline-block rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-ink hover:bg-brand-400">
                  {t("Request a quote")}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
