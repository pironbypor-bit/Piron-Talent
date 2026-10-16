import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { Dropdown } from "@/components/dropdown";
import { EmptyState } from "@/components/ui";
import { EmptyIllustration } from "@/components/illustrations";
import { requireFeature } from "@/lib/app/features";
import { countBookingsForMe, getMe, getMyCard, listProviders, type ProviderSort } from "@/lib/app/queries";
import { resolveCard } from "@/lib/app/cards";
import { categoryLabel, getCategories } from "@/lib/categories";
import { CITIES, isCity } from "@/lib/cities";
import { isAvailableNow } from "@/components/signals";
import { getLocale, getT } from "@/lib/i18n/server";
import { HomeStrip } from "../home-strip";
import { ProCard } from "./pro-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Professionals") };
}

type Params = { q?: string; category?: string; city?: string; sort?: string; now?: string; checked?: string; remote?: string };

/** The Services page, upgraded: people as cards, search and filters, then (step 4) a Book button. */
export default async function ProfessionalsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireFeature("home_pages");
  const [t, locale, categories, params, me, myCard, waiting] = await Promise.all([getT(), getLocale(), getCategories(), searchParams, getMe(), getMyCard(), countBookingsForMe()]);
  const selected = categories.find((c) => String(c.id) === params.category) ?? null;
  const q = (params.q ?? "").trim().slice(0, 60);
  const city = isCity(params.city) ? params.city : "";
  const remote = params.remote === "1";
  const nowOnly = params.now === "1";
  const checkedOnly = params.checked === "1";
  const sort: ProviderSort = params.sort === "completed" || params.sort === "newest" ? params.sort : "rated";

  const all = await listProviders({ categoryId: selected?.id, q, remote, city, sort });
  const cards = all
    .map((p) => ({ p, c: resolveCard(p) }))
    .filter(({ p, c }) => c.complete && (!nowOnly || isAvailableNow(p)) && (!checkedOnly || p.identity_checked));
  const hidden = all.length - all.filter((p) => resolveCard(p).complete).length;

  const qs = (over: Partial<Params>) => {
    const sp = new URLSearchParams();
    const merged: Params = { q: q || undefined, category: selected ? String(selected.id) : undefined, city: city || undefined, sort: params.sort, now: nowOnly ? "1" : undefined, checked: checkedOnly ? "1" : undefined, remote: remote ? "1" : undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/app/professionals?${s}` : "/app/professionals";
  };
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-ink bg-ink text-white" : "border-stone-300 bg-white hover:bg-brand-50"}`;
  const mine = me ? resolveCard({ ...me, skills: me.skills, card: myCard }) : null;
  const myState = !me ? null : !me.is_available ? "hidden" : mine && !mine.complete ? "needs" : "published";

  return (
    <main className="px-4 pb-24 pt-4">
      <HomeStrip current="professionals" t={t} badge={waiting} />
      <div className="flex items-baseline justify-between">
        <h1 className="text-sm font-bold">{t("Available professionals")}</h1>
        <span className="text-xs text-ink-muted">{t("{n} professionals", { n: cards.length })}</span>
      </div>

      <form method="get" action="/app/professionals" className="mt-2 space-y-2">
        {nowOnly && <input type="hidden" name="now" value="1" />}
        {checkedOnly && <input type="hidden" name="checked" value="1" />}
        {remote && <input type="hidden" name="remote" value="1" />}
        <label className="relative block">
          <span className="sr-only">{t("Search providers")}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <input name="q" defaultValue={q} maxLength={60} placeholder={t("Search by name, role or skill")} className="w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-brand-500" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Dropdown compact submitOnChange name="category" defaultValue={selected ? String(selected.id) : ""} label={t("Category")} options={[{ value: "", label: t("All categories") }, ...categories.map((c) => ({ value: String(c.id), label: categoryLabel(c, locale) }))]} />
          <Dropdown compact submitOnChange name="city" defaultValue={city} label={t("Province or city")} options={[{ value: "", label: t("All provinces and cities") }, ...CITIES.map((c) => ({ value: c, label: t(c) }))]} />
        </div>
        <div className="w-1/2 min-w-40">
          <Dropdown compact submitOnChange name="sort" defaultValue={sort} label={t("Sort")} options={[{ value: "rated", label: t("Best rated") }, { value: "completed", label: t("Most completed jobs") }, { value: "newest", label: t("Newest") }]} />
        </div>
      </form>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link href={qs({ now: nowOnly ? undefined : "1" })} className={chip(nowOnly)}>{t("Available now")}</Link>
        <Link href={qs({ checked: checkedOnly ? undefined : "1" })} className={chip(checkedOnly)}>{t("Identity checked")}</Link>
        <Link href={qs({ remote: remote ? undefined : "1" })} className={chip(remote)}>{t("Remote")}</Link>
      </div>

      {me && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-dashed border-brand-400 bg-brand-50 p-3">
          <p className="min-w-0 text-sm">
            <b>{t("Your card")}</b> ·{" "}
            <span className={myState === "published" ? "text-green-800" : myState === "needs" ? "text-amber-800" : "text-ink-muted"}>
              {myState === "published" ? t("Published") : myState === "needs" ? t("Needs details") : t("Hidden")}
            </span>
          </p>
          <Link href="/app/profile/card" className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-brand-50"><Pencil className="size-3" />{t("Edit my card")}</Link>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            illustration={<EmptyIllustration kind="people" />}
            action={<Link href="/app/profile/card" className="inline-block rounded-full bg-brand-500 px-4 py-2 font-semibold text-ink hover:bg-brand-400">{t("Edit my card")}</Link>}
          >
            {q || selected || city || nowOnly || checkedOnly || remote ? t("No results. Try another word.") : t("No providers yet.")}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {cards.map(({ p, c }) => (
            <ProCard key={p.id} id={p.id} card={c} avatarUrl={p.avatar_url} checked={p.identity_checked} availableUntil={p.available_until} rating={p.rating} reviews={p.reviews} saved={p.saved} path={qs({})} t={t} bookHref={me && me.id === p.id ? undefined : `/app/book/${p.id}`} />
          ))}
        </div>
      )}
      {hidden > 0 && <p className="mt-4 text-center text-xs text-ink-muted">{t("{n} more need to add details before they appear.", { n: hidden })}</p>}
    </main>
  );
}
