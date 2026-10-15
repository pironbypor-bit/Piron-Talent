"use client";

import { ChevronDown } from "lucide-react";

/** Dropdown filter inside the Home search form: choosing an option sends the form straight away. */
export function KindSelect({ value, options, label }: { value: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <div className="relative mt-2 w-1/2 min-w-40">
      <label htmlFor="home-kind" className="sr-only">{label}</label>
      <select
        id="home-kind"
        name="kind"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full appearance-none rounded-full border border-stone-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium shadow-sm outline-none focus:border-brand-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted" />
    </div>
  );
}
