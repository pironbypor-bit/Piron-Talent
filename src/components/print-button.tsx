"use client";

import { Printer } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/** Opens the browser print dialog; on a phone this is also "Save as PDF". */
export function PrintButton() {
  const t = useT();
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-brand-50 print:hidden">
      <Printer className="size-4" aria-hidden="true" />
      {t("Print or save as PDF")}
    </button>
  );
}
