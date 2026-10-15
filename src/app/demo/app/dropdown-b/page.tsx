import type { Metadata } from "next";
import { DropdownCompare } from "../dropdown-compare";
import { DropdownDemoB } from "./view";

export const metadata: Metadata = { title: "Dropdown demo B" };

/** Demo B: a bottom sheet. Sample data, nothing is saved. */
export default function DropdownDemoBPage() {
  return (
    <main className="px-4 pb-24 pt-4">
      <DropdownCompare />
      <h1 className="text-xl font-bold">Bottom sheet</h1>
      <p className="mt-1 text-sm text-ink-muted">Tap a field and a sheet slides up from the bottom with big rows. Easy for thumbs and long Khmer words. Try the filter, the form fields and the account menu.</p>
      <DropdownDemoB />
    </main>
  );
}
