"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Bookmark, MapPin, Search, Star } from "lucide-react";
import { Dropdown } from "@/components/dropdown";
import { PROS, type Pro } from "./data";

const CATS = ["All categories", ...Array.from(new Set(PROS.map((p) => p.category)))];
const CITIES = ["All cities", ...Array.from(new Set(PROS.map((p) => p.city)))];

export type MyCard = { published: boolean; title: string; services: string; price: string; city: string; about: string; icon: string };
export const START_CARD: MyCard = { published: true, title: "Sophea Design", services: "Logos · Menus · Posters", price: "20", city: "Phnom Penh", about: "Graphic designer for small shops and cafes.", icon: "🎨" };

function Card({ p, onBook, kept, onKeep }: { p: Pro; onBook: () => void; kept: boolean; onKeep: () => void }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 text-5xl" aria-hidden="true">
        {p.icon}
        <button type="button" onClick={onKeep} aria-label={kept ? "Remove from kept" : "Keep"} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-sm"><Bookmark className={`size-4 ${kept ? "fill-brand-500 text-brand-700" : "text-ink-muted"}`} /></button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="flex items-center gap-1 text-sm font-bold leading-tight">{p.name}{p.checked && <BadgeCheck className="size-4 shrink-0 text-green-600" aria-label="Identity checked" />}</h3>
        <p className="mt-0.5 text-[11px] text-ink-muted">{p.kind === "company" ? "Company" : "Person"}{p.now ? " · Available now" : ""}</p>
        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{p.services}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-0.5"><Star className="size-3 fill-amber-400 text-amber-400" />{p.rating} ({p.reviews})</span>
          <span className="inline-flex items-center gap-0.5"><MapPin className="size-3 text-rose-400" />{p.city}</span>
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="text-base font-bold">${p.price}<span className="ml-1 text-xs font-normal text-ink-muted">/{p.unit}</span></p>
          <button type="button" onClick={onBook} className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">Book</button>
        </div>
      </div>
    </article>
  );
}

export function Professionals({ mine, onBook }: { mine: MyCard; onBook: (name: string, price: number) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [city, setCity] = useState(CITIES[0]);
  const [sort, setSort] = useState("rated");
  const [now, setNow] = useState(false);
  const [checked, setChecked] = useState(false);
  const [kept, setKept] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<MyCard>(mine);
  const [saved, setSaved] = useState(false);

  const list = useMemo(() => {
    const all: Pro[] = card.published
      ? [...PROS, { id: "me", name: card.title, icon: card.icon, services: card.services, rating: 0, reviews: 0, city: card.city, price: Number(card.price) || 0, unit: "from", kind: "person", checked: false, now: true, category: "Creative" }]
      : PROS;
    return all
      .filter((p) => (!q || (p.name + p.services).toLowerCase().includes(q.toLowerCase())) && (cat === CATS[0] || p.category === cat) && (city === CITIES[0] || p.city === city) && (!now || p.now) && (!checked || p.checked))
      .sort((a, b) => (sort === "price" ? a.price - b.price : sort === "jobs" ? b.reviews - a.reviews : b.rating - a.rating));
  }, [q, cat, city, sort, now, checked, card]);

  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-ink bg-ink text-white" : "border-stone-300 bg-white"}`;
  const field = "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm";
  const missing = [!card.services && "services line", !card.price && "price from", !card.city && "city"].filter(Boolean);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold">Available professionals</h2>
        <span className="text-xs text-ink-muted">{list.length} professionals</span>
      </div>
      <label className="relative mt-2 block">
        <span className="sr-only">Search professionals</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, service or skill" className="w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-brand-500" />
      </label>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Dropdown compact label="Category" value={cat} onChange={setCat} options={CATS.map((c) => ({ value: c, label: c }))} />
        <Dropdown compact label="City" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c }))} />
        <Dropdown compact label="Sort" value={sort} onChange={setSort} options={[{ value: "rated", label: "Best rated" }, { value: "price", label: "Lowest price" }, { value: "jobs", label: "Most reviewed" }]} />
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" className={chip(now)} onClick={() => setNow(!now)}>Available now</button>
        <button type="button" className={chip(checked)} onClick={() => setChecked(!checked)}>Identity checked</button>
      </div>

      <div className="mt-3 rounded-2xl border border-dashed border-brand-400 bg-brand-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm"><b>Your card</b> · <span className={card.published ? "text-green-800" : "text-ink-muted"}>{card.published ? "Published" : "Hidden"}</span></p>
          <button type="button" onClick={() => setOpen(!open)} className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold">{open ? "Close" : "Edit my card"}</button>
        </div>
        {open && (
          <div className="mt-3 space-y-2 text-xs font-semibold text-ink-muted">
            <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={card.published} onChange={(e) => setCard({ ...card, published: e.target.checked })} /> Published (shown to everyone)</label>
            <label className="block">Name on the card<input className={field} value={card.title} onChange={(e) => setCard({ ...card, title: e.target.value })} /></label>
            <label className="block">Services line<input className={field} value={card.services} onChange={(e) => setCard({ ...card, services: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">Price from (USD)<input className={field} inputMode="decimal" value={card.price} onChange={(e) => setCard({ ...card, price: e.target.value })} /></label>
              <label className="block">City<input className={field} value={card.city} onChange={(e) => setCard({ ...card, city: e.target.value })} /></label>
            </div>
            <label className="block">Short description<textarea className={field} rows={2} value={card.about} onChange={(e) => setCard({ ...card, about: e.target.value })} /></label>
            {missing.length > 0 && <p className="rounded-lg bg-amber-100 px-2 py-1 text-amber-900">Needs details to appear: {missing.join(", ")}.</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1500); }} className="rounded-xl bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink">Save card</button>
              <button type="button" onClick={() => setCard(START_CARD)} className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-ink">Use profile details again</button>
              {saved && <span className="self-center text-green-800">Saved</span>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {list.map((p) => (
          <Card key={p.id} p={p} kept={kept.includes(p.id)} onKeep={() => setKept(kept.includes(p.id) ? kept.filter((k) => k !== p.id) : [...kept, p.id])} onBook={() => onBook(p.name, p.price)} />
        ))}
      </div>
      {list.length === 0 && <p className="mt-6 text-center text-sm text-ink-muted">Nobody matches. Try fewer filters.</p>}
    </div>
  );
}
