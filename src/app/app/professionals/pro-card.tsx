import Link from "next/link";
import { BadgeCheck, Bookmark, MapPin, Star } from "lucide-react";
import { toggleKeepProvider } from "@/lib/app/actions";
import { AvatarImg } from "../avatar";
import { isAvailableNow } from "@/components/signals";
import type { T } from "@/lib/i18n/core";
import type { ResolvedCard } from "@/lib/app/cards";

type Props = {
  id: string;
  card: ResolvedCard;
  avatarUrl: string | null;
  checked: boolean;
  availableUntil: string | null;
  rating: number | null;
  reviews: number;
  saved?: boolean;
  path?: string;
  t: T;
  /** Preview in the editor: no links, no keep button. */
  preview?: boolean;
  /** When set the main button is Book and goes here; otherwise it is View profile. */
  bookHref?: string;
};

/** One card of the Professionals page. Server component: the keep button is a plain form. */
export function ProCard({ id, card, avatarUrl, checked, availableUntil, rating, reviews, saved = false, path = "/app/professionals", t, preview = false, bookHref }: Props) {
  const now = isAvailableNow({ available_until: availableUntil });
  const keep = toggleKeepProvider.bind(null, id, path);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100">
        <AvatarImg name={card.name} url={avatarUrl} size={14} />
        {!preview && (
          <form action={keep} className="absolute right-2 top-2">
            <button type="submit" aria-pressed={saved} aria-label={saved ? t("Kept") : t("Keep")} className="rounded-full bg-white/90 p-1.5 shadow-sm">
              <Bookmark className={`size-4 ${saved ? "fill-brand-500 text-brand-700" : "text-ink-muted"}`} />
            </button>
          </form>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="flex items-center gap-1 text-sm font-bold leading-tight">
          <span className="min-w-0 break-words">{card.name}</span>
          {checked && <BadgeCheck className="size-4 shrink-0 text-green-600" aria-label={t("Identity checked")} />}
        </h3>
        {now && <p className="mt-0.5 text-[11px] font-medium text-emerald-700">{t("Available this week")}</p>}
        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{card.services}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
          {rating !== null ? (
            <span className="inline-flex items-center gap-0.5"><Star className="size-3 fill-amber-400 text-amber-400" />{rating.toFixed(1)} ({reviews})</span>
          ) : (
            <span>{t("New")}</span>
          )}
          {card.city && <span className="inline-flex items-center gap-0.5"><MapPin className="size-3 text-rose-400" />{t(card.city)}</span>}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className="min-w-0 truncate text-sm font-bold">{card.price}</p>
          {preview ? (
            <span className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">{t("View profile")}</span>
          ) : (
            <Link href={bookHref ?? `/app/providers/${id}`} className="shrink-0 rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">{bookHref ? t("Book") : t("View profile")}</Link>
          )}
        </div>
      </div>
    </article>
  );
}
