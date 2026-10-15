"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Bell, Check, ChevronDown, LogOut, Search, Settings } from "lucide-react";
import { CATEGORIES, CITIES, FILTERS, JOB_TYPES, type Opt } from "@/lib/demo/dropdown-fixtures";

// Demo A: a floating list under the field. Rounded card, one line per choice, a check on the chosen one,
// a search box when the list is long. Keyboard: arrows, Enter, Escape. Sample data only.

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open, close]);
  return ref;
}

function PopSelect({ label, value, onChange, options, searchable = false, compact = false }: { label: string; value: string; onChange: (v: string) => void; options: Opt[]; searchable?: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const id = useId();
  const root = useOutside(open, () => setOpen(false));
  const shown = searchable && q.trim() ? options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const current = options.find((o) => o.value === value);

  function toggle() {
    if (!open) {
      setQ("");
      setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    }
    setOpen(!open);
  }
  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) toggle();
      else setActive((i) => Math.min(i + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && shown[active]) {
      e.preventDefault();
      pick(shown[active].value);
    }
  }

  return (
    <div ref={root} className={`relative ${compact ? "w-1/2 min-w-40" : ""}`} onKeyDown={onKey}>
      {!compact && <p className="mb-1 text-xs font-semibold text-ink-muted">{label}</p>}
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={compact ? label : undefined}
        className={`flex w-full items-center justify-between gap-2 border bg-white text-left shadow-sm transition ${open ? "border-brand-500 ring-2 ring-brand-200" : "border-stone-200 hover:border-stone-300"} ${compact ? "rounded-full px-3 py-1.5 text-xs font-medium" : "rounded-2xl px-3.5 py-3 text-sm"}`}
      >
        <span className="truncate">{current?.label ?? "Choose"}</span>
        <ChevronDown className={`size-4 shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
          {searchable && (
            <div className="relative border-b border-stone-100 p-2">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
              <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} placeholder="Search" className="w-full rounded-xl bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
          )}
          <ul id={`${id}-list`} role="listbox" className="max-h-60 overflow-auto p-1.5">
            {shown.length === 0 && <li className="px-3 py-3 text-sm text-ink-muted">Nothing found</li>}
            {shown.map((o, i) => {
              const chosen = o.value === value;
              return (
                <li key={o.value} role="option" aria-selected={chosen}>
                  <button
                    type="button"
                    onClick={() => pick(o.value)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${i === active ? "bg-brand-50" : ""} ${chosen ? "font-semibold" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{o.label}</span>
                      {o.hint && <span className="block truncate text-xs font-normal text-ink-muted">{o.hint}</span>}
                    </span>
                    {chosen && <Check className="size-4 shrink-0 text-brand-700" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function MenuPop() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");
  const ref = useOutside(open, () => setOpen(false));
  const row = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-brand-50";
  const go = (what: string) => {
    setDone(what);
    setOpen(false);
  };
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:border-stone-300">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand-200 text-xs font-bold">P</span>
        POR
        <ChevronDown className={`size-4 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl">
          <div className="px-3 pb-2 pt-1.5">
            <p className="text-sm font-semibold">POR</p>
            <p className="text-xs text-ink-muted">Logo designer · Phnom Penh</p>
          </div>
          <div className="border-t border-stone-100 pt-1">
            <button type="button" className={row} onClick={() => go("Notifications")}><Bell className="size-4 text-ink-muted" /><span className="flex-1">Notifications</span><span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-semibold">7</span></button>
            <button type="button" className={row} onClick={() => go("Settings")}><Settings className="size-4 text-ink-muted" />Settings</button>
          </div>
          <div className="mt-1 border-t border-stone-100 pt-1">
            <button type="button" className={`${row} text-red-700`} onClick={() => go("Log out")}><LogOut className="size-4" />Log out</button>
          </div>
        </div>
      )}
      {done && <p className="mt-2 text-xs text-ink-muted">You chose: {done}</p>}
    </div>
  );
}

export function DropdownDemoA() {
  const [filter, setFilter] = useState("all");
  const [cat, setCat] = useState("design");
  const [city, setCity] = useState("pp");
  const [type, setType] = useState("freelance");
  const section = "card mt-3 p-4";
  return (
    <div>
      <section className={section}>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Home filter</p>
        <div className="mt-2"><PopSelect compact label="Show" value={filter} onChange={setFilter} options={FILTERS} /></div>
        <p className="mt-3 text-xs text-ink-muted">Showing: {FILTERS.find((f) => f.value === filter)?.label}</p>
      </section>
      <section className={`${section} space-y-3`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Form fields</p>
        <PopSelect searchable label="Category" value={cat} onChange={setCat} options={CATEGORIES} />
        <PopSelect label="City" value={city} onChange={setCity} options={CITIES} />
        <PopSelect label="Job type" value={type} onChange={setType} options={JOB_TYPES} />
      </section>
      <section className={`${section} pb-6`}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-800">Account menu</p>
        <MenuPop />
      </section>
    </div>
  );
}
