import type { Metadata } from "next";
import { DropdownCompare } from "../dropdown-compare";
import { DropdownDemoA } from "./view";

export const metadata: Metadata = { title: "Dropdown demo A" };

/** Demo A: a floating list under the field. Sample data, nothing is saved. */
export default function DropdownDemoAPage() {
  return (
    <main className="px-4 pb-24 pt-4">
      <DropdownCompare />
      <h1 className="text-xl font-bold">Popover list</h1>
      <p className="mt-1 text-sm text-ink-muted">The list opens right under the field. Good on desktop and for short lists. Try the filter, the form fields and the account menu.</p>
      <DropdownDemoA />
    </main>
  );
}
