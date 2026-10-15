"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export type DropdownOption = { value: string; label: string; hint?: string };

type Props = {
  options: DropdownOption[];
  /** Form field name. A hidden native select carries the value, so forms, required and FormData work as before. */
  name?: string;
  defaultValue?: string;
  /** Controlled use: pass value and onChange. */
  value?: string;
  onChange?: (value: string) => void;
  /** Accessible name when there is no visible label. */
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Pill shape for filters. */
  compact?: boolean;
  /** Smaller fields (admin rows). */
  small?: boolean;
  /** Search box inside the list. Default: on when there are more than 8 choices. */
  searchable?: boolean;
  /** Send the form as soon as a choice is made (filters). */
  submitOnChange?: boolean;
  id?: string;
  className?: string;
};

/**
 * Design A from the dropdown demo: a rounded field that opens a floating list under it (or above it when the
 * screen is short), a check on the chosen row, an optional hint line, a search box on long lists.
 * Keyboard: arrows, Enter, Escape. The list is the only custom part; the value lives in a real hidden select.
 */
export function Dropdown({ options, name, defaultValue, value, onChange, label, placeholder, required, disabled, compact, small, searchable, submitOnChange, id, className = "" }: Props) {
  const t = useT();
  const [inner, setInner] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const native = useRef<HTMLSelectElement>(null);
  const uid = useId();
  const current = value ?? inner;
  const withSearch = searchable ?? options.length > 8;
  const word = q.trim().toLowerCase();
  const shown = withSearch && word ? options.filter((o) => o.label.toLowerCase().includes(word)) : options;
  const chosen = options.find((o) => o.value === current);
  const empty = !chosen || (chosen.value === "" && !chosen.label);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);

  function toggle() {
    if (disabled) return;
    if (!open) {
      setQ("");
      setActive(Math.max(0, options.findIndex((o) => o.value === current)));
      const r = root.current?.getBoundingClientRect();
      if (r) setUp(window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom);
    }
    setOpen(!open);
  }
  function pick(v: string) {
    setInner(v);
    setOpen(false);
    onChange?.(v);
    if (submitOnChange) requestAnimationFrame(() => native.current?.form?.requestSubmit());
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

  const wide = /(^|\s)(w-|flex-1)/.test(className);
  const shape = compact ? "rounded-full px-3 py-1.5 text-xs font-medium" : small ? "rounded-xl px-3 py-1.5 text-sm" : "rounded-xl px-3 py-2.5 text-base";
  return (
    <div ref={root} className={`relative min-w-0 ${wide ? "" : "w-full"} ${className}`} onKeyDown={onKey}>
      <select ref={native} name={name} value={current} onChange={() => {}} required={required} disabled={disabled} tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-0">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        type="button"
        id={id}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-label={label}
        className={`flex w-full items-center justify-between gap-2 border bg-white text-left text-ink shadow-sm transition disabled:opacity-60 ${open ? "border-brand-500 ring-2 ring-brand-200" : "border-stone-300 hover:border-stone-400"} ${shape}`}
      >
        <span className={`truncate ${empty ? "text-stone-400" : ""}`}>{empty ? (placeholder ?? t("Choose")) : chosen.label}</span>
        <ChevronDown className={`size-4 shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute left-0 z-40 w-max min-w-full max-w-[min(22rem,88vw)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl ${up ? "bottom-full mb-2" : "mt-2"}`}>
          {withSearch && (
            <div className="relative border-b border-stone-100 p-2">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
              <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} placeholder={t("Search")} aria-label={t("Search")} className="w-full rounded-xl bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand-200" />
            </div>
          )}
          <ul id={`${uid}-list`} role="listbox" className="max-h-60 overflow-auto p-1.5">
            {shown.length === 0 && <li className="px-3 py-3 text-sm text-ink-muted">{t("Nothing found")}</li>}
            {shown.map((o, i) => {
              const on = o.value === current;
              return (
                <li key={o.value} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => pick(o.value)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${i === active ? "bg-brand-50" : ""} ${on ? "font-semibold" : ""}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{o.label || placeholder || t("Choose")}</span>
                      {o.hint && <span className="block truncate text-xs font-normal text-ink-muted">{o.hint}</span>}
                    </span>
                    {on && <Check className="size-4 shrink-0 text-brand-700" />}
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
