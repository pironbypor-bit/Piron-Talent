import Link from "next/link";
import { Pill } from "@/components/ui";
import { pick, type DemoProvider, type L } from "@/lib/demo/fixtures";
import type { Locale, T } from "@/lib/i18n/core";

/** Pieces shared by the demo pages. Server-safe; no state. */

export function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} / 5`} className="text-brand-600">
      {"★".repeat(Math.round(rating))}
      <span className="text-stone-300">{"★".repeat(5 - Math.round(rating))}</span>
      <span className="ml-1 text-sm text-ink-muted">{rating.toFixed(1)}</span>
    </span>
  );
}

export function ProviderCard({ provider, locale, t, action }: { provider: DemoProvider; locale: Locale; t: T; action?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar name={pick(provider.name, locale)} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          <Link href={`/demo/providers/${provider.slug}`} className="hover:underline">
            {pick(provider.name, locale)}
          </Link>
          {provider.identityChecked && (
            <span className="ml-2 align-middle">
              <Pill tone="green">{t("Identity checked")}</Pill>
            </span>
          )}
        </p>
        <p className="text-sm text-ink-muted">
          {pick(provider.role, locale)} · {t("{n} years", { n: provider.years })} · {t("{n} completed jobs", { n: provider.completedJobs })}
        </p>
        <Stars rating={provider.rating} />
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-200 font-bold text-brand-900" aria-hidden="true">
      {name.trim().charAt(0)}
    </span>
  );
}

export function PortfolioGrid({ items, locale }: { items: { caption: L; tone: string }[]; locale: Locale }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item, i) => (
        <li key={i} className="overflow-hidden rounded-xl border border-stone-200">
          <div className={`aspect-[4/3] ${item.tone}`} aria-hidden="true" />
          <p className="px-3 py-2 text-sm">{pick(item.caption, locale)}</p>
        </li>
      ))}
    </ul>
  );
}

export { formatDate as demoDate } from "@/lib/dates";
