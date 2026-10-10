import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, FileText, Laptop, MoreHorizontal, Palette, Scale, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import { EmptyState, Pill } from "@/components/ui";
import { toggleKeepProvider } from "@/lib/app/actions";
import { listProviders } from "@/lib/app/queries";
import { categoryLabel, getCategories } from "@/lib/categories";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Services") };
}

const ICONS: Record<string, LucideIcon> = { finance: Calculator, documents: FileText, legal: Scale, technology: Laptop, electrical: Wrench, beauty: Sparkles, creative: Palette };
const GRID = ["finance", "documents", "legal", "technology", "electrical", "beauty", "creative"];

/** Services tab: category grid from the categories table, then providers who marked themselves available. */
export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [t, locale, categories, { category }] = await Promise.all([getT(), getLocale(), getCategories(), searchParams]);
  const selected = categories.find((c) => String(c.id) === category) ?? null;
  const providers = await listProviders(selected?.id);
  const path = selected ? `/app/services?category=${selected.id}` : "/app/services";

  return (
    <main className="px-4 py-4">
      <h1 className="text-xl font-bold">{t("Find professional services")}</h1>
      <p className="text-sm text-ink-muted">{t("Skilled people. Checked identity. Phnom Penh.")}</p>

      <ul className="mt-4 grid grid-cols-4 gap-2">
        {GRID.map((slug) => {
          const c = categories.find((x) => x.slug === slug);
          if (!c) return null;
          const Icon = ICONS[slug];
          const review = slug === "legal" || slug === "electrical";
          const active = selected?.id === c.id;
          return (
            <li key={slug}>
              <Link href={active ? "/app/services" : `/app/services?category=${c.id}`} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-3 text-center text-xs font-medium shadow-sm ${active ? "bg-brand-200" : "bg-white hover:bg-brand-50"} ${review ? "opacity-60" : ""}`}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                  <Icon className="size-5" />
                </span>
                <span className="line-clamp-2 leading-tight">{categoryLabel(c, locale).split(/ (&|និង) /)[0]}</span>
                {review && <span className="text-[10px] font-normal text-ink-muted">{t("After review")}</span>}
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/app/services" className="flex flex-col items-center gap-1 rounded-2xl bg-white px-1 py-3 text-center text-xs font-medium shadow-sm hover:bg-brand-50">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
              <MoreHorizontal className="size-5" />
            </span>
            {t("More")}
          </Link>
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-bold">{selected ? categoryLabel(selected, locale) : t("Popular providers")}</h2>
      {providers.length === 0 ? (
        <div className="mt-3">
          <EmptyState>{t("No providers yet.")}</EmptyState>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {providers.map((p) => {
            const keep = toggleKeepProvider.bind(null, p.id, path);
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                <AvatarImg name={p.display_name} url={p.avatar_url} />
                <div className="min-w-0 flex-1">
                  <Link href={`/app/providers/${p.id}`} className="block truncate font-semibold hover:underline">
                    {p.role_line || p.display_name}
                  </Link>
                  <p className="truncate text-sm text-ink-muted">
                    {p.display_name}
                    {p.city ? ` · ${p.city}` : ""}
                    {p.remote ? ` · ${t("Remote")}` : ""}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                    {p.identity_checked && <Pill tone="green">{t("Identity checked")}</Pill>}
                    <span className="text-ink-muted">{t("{n} completed jobs", { n: p.completed_jobs })}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {p.price_from && <p className="text-sm font-semibold">{p.price_from}</p>}
                  <form action={keep}>
                    <button type="submit" aria-pressed={p.saved} className={`mt-1 rounded-full border px-3 py-1 text-xs font-semibold ${p.saved ? "border-brand-400 bg-brand-100" : "border-stone-300 hover:bg-stone-50"}`}>
                      {p.saved ? t("Kept") : t("Keep")}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
