"use client";

import { useEffect, useState } from "react";
import { Bell, Check, ChevronDown, LogOut, Search, Settings, X } from "lucide-react";
import { CATEGORIES, CITIES, FILTERS, JOB_TYPES, type Opt } from "@/lib/demo/dropdown-fixtures";

// Demo B: a bottom sheet. Tap a field and a sheet slides up with big rows, a title and a close button.
// Made for thumbs and for Khmer text that needs room. Sample data only.

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div role="dialog" aria-modal="true" aria-label={title} className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[80vh] w-full max-w-md flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-stone-300" />
        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <h2 className="text-base font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-stone-100"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SheetSelect({ label, value, onChange, options, searchable = false, compact = false }: { label: string; value: string; onChange: (v: string) => void; options: Opt[]; searchable?: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const shown = searchable && q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const current = options.find((o) => o.value === value);
  const close = () => setOpen(false);
  return (
    <div className={compact ? "w-1/2 min-w-40" : ""}>
      {!compact && <p className="mb-1 text-xs font-semibold text-ink-muted">{label}</p>}
      <button
        type="button"
        onClick={() => { setQ(""); setOpen(true); }}
        aria-haspopup="dialog"
        aria-label={compact ? label : undefined}
        className={`flex w-full items-center justify-between gap-2 border border-stone-200 bg-white text-left shadow-sm hover:border-stone-300 ${compact ? "rounded-full px-3 py-1.5 text-xs font-medium" : "rounded-2xl px-3.5 py-3 text-sm"}`}
      >
        <span className="truncate">{current?.label ?? "Choose"}</span>
        <ChevronDown className="size-4 shrink-0 text-ink-muted" />
      </button>
      {open && (
        <Sheet title={label} onClose={close}>
          {searchable && (
            <div className="relative px-4 pb-2">
              <Search className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-[60%] text-ink-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full rounded-2xl bg-stone-100 py-3 pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
          )}
          <ul role="listbox" className="overflow-auto px-3 pb-4">
            {shown.length === 0 && <li className="px-3 py-4 text-sm text-ink-muted">Nothing found</li>}
            {shown.map((o) => {
              const chosen = o.value === value;
              return (
                <li key={o.value} role="option" aria-selected={chosen}>
                  <button type="button" onClick={() => { onChange(o.value); close(); }} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left ${chosen ? "bg-brand-50" : "hover:bg-stone-50"}`}>
                    <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${chosen ? "border-brand-500 bg-brand-500" : "border-stone-300"}`}>
                      {chosen && <Check className="size-3.5 text-ink" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-base ${chosen ? "font-semibold" : ""}`}>{o.label}</span>
                      {o.hint && <span className="block text-sm text-ink-muted">{o.hint}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
    </div>
  );
}

function MenuSheet() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");
  const row = "flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-base hover:bg-stone-50";
  const go = (what: string) => {
    setDone(what);
    setOpen(false);
  };
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:border-stone-300">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand-200 text-xs font-bold">P</span>
        POR
        <ChevronDown className="size-4 text-ink-muted" />
      </button>
      {done && <p className="mt-2 text-xs text-ink-muted">You chose: {done}</p>}
      {open && (
        <Sheet title="POR" onClose={() => setOpen(false)}>
          <div className="px-3 pb-4">
            <p className="px-3 pb-2 text-sm text-ink-muted">Logo designer · Phnom Penh</p>
            <button type="button" className={row} onClick={() => go("Notifications")}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-100"><Bell className="size-5" /></span>
              <span className="flex-1">Notifications</span>
              <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-sm font-semibold">7</span>
            </button>
            <button type="button" className={row} onClick={() => go("Settings")}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-stone-100"><Settings className="size-5" /></span>
              <span className="flex-1">Settings</span>
            </button>
            <button type="button" className={`${row} text-red-700`} onClick={() => go("Log out")}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-red-50"><LogOut className="size-5" /></span>
              <span className="flex-1">Log out</span>
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

export function DropdownDemoB() {
  const [filter, setFilter] = useState("all");
  const [cat, setCat] = useState("design");
  const [city, setCity] = useState("pp");
  const [type, setType] = useState("freelance");
  const section = "card mt-3 p-4";
  return (
    <div>
      <section className={section}>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Home filter</p>
        <div className="mt-2"><SheetSelect compact label="Show" value={filter} onChange={setFilter} options={FILTERS} /></div>
        <p className="mt-3 text-xs text-ink-muted">Showing: {FILTERS.find((f) => f.value === filter)?.label}</p>
      </section>
      <section className={`${section} space-y-3`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Form fields</p>
        <SheetSelect searchable label="Category" value={cat} onChange={setCat} options={CATEGORIES} />
        <SheetSelect label="City" value={city} onChange={setCity} options={CITIES} />
        <SheetSelect label="Job type" value={type} onChange={setType} options={JOB_TYPES} />
      </section>
      <section className={`${section} pb-6`}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-800">Account menu</p>
        <MenuSheet />
      </section>
    </div>
  );
}
