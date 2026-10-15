"use client";

import { useEffect } from "react";

/** Last resort when even the page frame fails. Plain markup: nothing else is loaded here. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (error.digest) return;
    void fetch("/api/report-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: error.message, path: window.location.pathname }),
    }).catch(() => {});
  }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "4rem 1rem", textAlign: "center" }}>
        <h1>Something went wrong</h1>
        <p>មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។</p>
        <button type="button" onClick={reset} style={{ marginTop: "1.5rem", padding: "0.75rem 1.25rem", borderRadius: 12, border: 0, background: "#f5b800", fontWeight: 600 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
