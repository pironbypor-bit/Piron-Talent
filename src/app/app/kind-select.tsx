"use client";

import { Dropdown, type DropdownOption } from "@/components/dropdown";

/** Dropdown filter inside the Home search form: choosing an option sends the form straight away. */
export function KindSelect({ value, options, label }: { value: string; options: DropdownOption[]; label: string }) {
  return (
    <div className="mt-2">
      <Dropdown compact submitOnChange name="kind" defaultValue={value} label={label} options={options} className="w-1/2 min-w-40" />
    </div>
  );
}
