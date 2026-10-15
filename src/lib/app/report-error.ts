// Reports an app error to log_app_error (migration 0049). Anonymous call: the database groups repeats and
// alerts the owner. Never throws, never blocks. Private text is not sent: addresses and long numbers are removed.

export type ErrorSource = "page" | "action" | "route" | "job" | "browser";

function clean(text: string): string {
  return text
    .replace(/[^\s@"'<>]+@[^\s@"'<>]+/g, "[email]")
    .replace(/\d{6,}/g, "[number]")
    .slice(0, 300);
}

export async function reportError(source: ErrorSource, message: string, path?: string | null): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return;
  try {
    await fetch(`${base}/rest/v1/rpc/log_app_error`, {
      method: "POST",
      headers: { apikey: key, "content-type": "application/json" },
      body: JSON.stringify({ p_source: source, p_message: clean(message), p_path: path ? clean(path.split("?")[0]) : null }),
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
  } catch {
    // Reporting is best effort.
  }
}
