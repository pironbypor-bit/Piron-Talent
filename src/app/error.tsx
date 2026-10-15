"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

/** Shown when a page fails to draw. Errors without a digest happened in the browser and are sent to the owner's list;
 *  server errors are reported by instrumentation.ts. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    if (error.digest) return;
    void fetch("/api/report-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: error.message, path: window.location.pathname }),
    }).catch(() => {});
  }, [error]);
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("Something went wrong")}</h1>
      <p className="mt-2 text-ink-muted">{t("The team has been told. Please try again.")}</p>
      <button type="button" onClick={reset} className="mt-6 rounded-xl bg-brand-500 px-5 py-3 font-semibold text-ink hover:bg-brand-400">{t("Try again")}</button>
    </main>
  );
}
