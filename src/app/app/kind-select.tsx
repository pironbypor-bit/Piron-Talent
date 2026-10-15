"use client";

import { ChevronDown } from "lucide-react";

/** Dropdown filter inside the Home search form: choosing an option sends the form straight away. */
export function KindSelect({ value, options, label }: { value: string; options: { value: string; label: string }[]; label: string }) {
  return (
    <div className="relative mt-3">
      <label htmlFor="home-kind" className="sr-only">{label}</label>
      <select
        id="home-kind"
        name="kind"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full appearance-none rounded-full border border-stone-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium shadow-sm outline-none focus:border-brand-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
    </div>
  );
}
