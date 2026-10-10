import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Calculator, FileText, Laptop, MoreHorizontal, Palette, Scale, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import { CheckedPill, EmptyState } from "@/components/ui";
import { EmptyIllustration } from "@/components/illustrations";
import { toggleKeepProvider } from "@/lib/app/actions";
import { listProviders } from "@/lib/app/queries";
import { categoryLabel, getCategories } from "@/lib/categories";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Services") };
}

const TILES: Record<string, { Icon: LucideIcon; tone: string; review?: boolean }> = {
  finance: { Icon: Calculator, tone: "bg-amber-100 text-amber-800" },
  documents: { Icon: FileText, tone: "bg-sky-100 text-sky-800" },
  legal: { Icon: Scale, tone: "bg-stone-200 text-stone-700", review: true },
  technology: { Icon: Laptop, tone: "bg-violet-100 text-violet-800" },
  electrical: { Icon: Wrench, tone: "bg-stone-200 text-stone-700", review: true },
  beauty: { Icon: Sparkles, tone: "bg-pink-100 text-pink-800" },
  creative: { Icon: Palette, tone: "bg-emerald-100 text-emerald-800" },
};
const GRID = ["finance", "documents", "legal", "technology", "electrical", "beauty", "creative"];

/** Services tab: category grid from the categories table, then providers who marked themselves available. */
export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const [t, locale, categories, { category }] = await Promise.all([getT(), getLocale(), getCategories(), searchParams]);
  const selected = categories.find((c) => String(c.id) === category) ?? null;
  const providers = await listProviders(selected?.id);
  const path = selected ? `/app/services?category=${selected.id}` : "/app/services";
  const short = (name: string) => name.split(/ (&|និង) /)[0];

  return (
    <main className="px-4 pb-24 pt-4">
      <section className="hero-amber rounded-3xl p-4">
        <h1 className="text-xl font-bold">{t("Find professional services")}</h1>
        <p className="text-sm text-brand-900">{t("Skilled people. Checked identity. Phnom Penh.")}</p>
      </section>

      <ul className="mt-4 grid grid-cols-4 gap-2">
        {GRID.map((slug) => {
          const c = categories.find((x) => x.slug === slug);
          if (!c) return null;
          const { Icon, tone, review } = TILES[slug];
          const active = selected?.id === c.id;
          return (
            <li key={slug}>
              <Link href={active ? "/app/services" : `/app/services?category=${c.id}`} aria-current={active ? "page" : undefined} className={`card flex h-full flex-col items-center gap-1.5 px-1 py-3 text-center text-[11px] font-medium leading-tight ${active ? "ring-2 ring-brand-500" : "hover:bg-brand-50"} ${review ? "opacity-70" : ""}`}>
                <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="size-5" />
                </span>
                <span className="line-clamp-2">{short(categoryLabel(c, locale))}</span>
                {review && <span className="text-[10px] font-normal text-ink-muted">{t("After review")}</span>}
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/app/services" className="card flex h-full flex-col items-center gap-1.5 px-1 py-3 text-center text-[11px] font-medium hover:bg-brand-50">
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
          <EmptyState
            illustration={<EmptyIllustration kind="people" />}
            action={
              <Link href="/app/profile/edit" className="inline-block rounded-full bg-brand-500 px-4 py-2 font-semibold text-ink hover:bg-brand-400">
                {t("I offer services (show me in Services)")}
              </Link>
            }
          >
            {t("No providers yet.")}
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {providers.map((p) => {
            const keep = toggleKeepProvider.bind(null, p.id, path);
            return (
              <li key={p.id} className="card flex items-center gap-3 p-3">
                <AvatarImg name={p.display_name} url={p.avatar_url} size={14} />
                <div className="min-w-0 flex-1">
                  <Link href={`/app/providers/${p.id}`} className="block truncate font-semibold hover:underline">
                    {p.role_line || p.display_name}
                  </Link>
                  <p className="truncate text-sm text-ink-muted">
                    {p.display_name}
                    {p.city ? ` · ${p.city}` : ""}
                    {p.remote ? ` · ${t("Remote")}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {p.identity_checked ? <CheckedPill>{t("Identity checked")}</CheckedPill> : <span className="rounded-full bg-stone-100 px-2 py-0.5 text-ink-muted">{t("New")}</span>}
                    <span className="text-ink-muted">{t("{n} completed jobs", { n: p.completed_jobs })}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {p.price_from && <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-900">{p.price_from}</span>}
                  <div className="flex items-center gap-1">
                    <form action={keep}>
                      <button type="submit" aria-pressed={p.saved} aria-label={p.saved ? t("Kept") : t("Keep")} className={`rounded-full border p-1.5 ${p.saved ? "border-brand-400 bg-brand-100" : "border-stone-200 hover:bg-stone-50"}`}>
                        <Bookmark className={`size-4 ${p.saved ? "fill-current" : ""}`} />
                      </button>
                    </form>
                    <Link href={`/app/providers/${p.id}`} className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-400">
                      {t("Request a quote")}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
