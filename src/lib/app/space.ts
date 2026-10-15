import { createClient } from "@/lib/supabase/server";

// Piron Work Space (owner only). Numbers come from space_overview() (migration 0045), which returns null for anyone else.

type Pair = [number, number];
type When = { at: string; status: string | number } | null;

export type SpaceOverview = {
  needs: { identity: number; reports: number; payouts: number; requests: number; applications: number; disputes: number };
  today: { users: Pair; posts: Pair; quotes: Pair; accepted: Pair; confirmed: Pair; active: number };
  totals: { users: number; providers: number; identity_checked: number; companies: number; open_posts: number; confirmed_jobs: number };
  growth: { day: string; n: number }[];
  reminders: When;
  email: When;
  push: When;
  send_failed_24h: number;
  recent: { at: string; action: string; target: string | null }[];
};

export type StatusRow = { name: string; note: string; ok: boolean };

/** Minutes since an ISO time, or null. */
export function minutesAgo(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.max(0, Math.round((Date.now() - t) / 60000));
}

export function agoText(iso: string | null | undefined): string {
  const m = minutesAgo(iso);
  if (m === null) return "never";
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} ago`;
  return `${Math.round(h / 24)} days ago`;
}

async function reachable(url: string, anon: string): Promise<{ ok: boolean; ms: number }> {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { apikey: anon }, signal: AbortSignal.timeout(4000), cache: "no-store" });
    return { ok: r.status < 500, ms: Date.now() - t0 };
  } catch {
    return { ok: false, ms: Date.now() - t0 };
  }
}

/** The overview plus live checks. data is null when the caller is not the owner. */
export async function getSpaceOverview(): Promise<{ data: SpaceOverview | null; status: StatusRow[] }> {
  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const t0 = Date.now();
  const [{ data, error }, auth, storage] = await Promise.all([
    supabase.rpc("space_overview"),
    reachable(`${base}/auth/v1/health`, anon),
    reachable(`${base}/storage/v1/bucket`, anon),
  ]);
  const dbMs = Date.now() - t0;
  const o = (error ? null : data) as SpaceOverview | null;
  const status: StatusRow[] = [{ name: "App", note: "This page was drawn by the app", ok: true }];
  status.push({ name: "Database", note: error ? "Did not answer" : `Answered in ${dbMs} ms`, ok: !error });
  status.push({ name: "Sign-in service", note: auth.ok ? `Answered in ${auth.ms} ms` : "Did not answer", ok: auth.ok });
  status.push({ name: "File storage", note: storage.ok ? `Answered in ${storage.ms} ms` : "Did not answer", ok: storage.ok });
  if (o) {
    const emailAt = o.email?.at ?? null;
    const pushAt = o.push?.at ?? null;
    const failed = o.send_failed_24h;
    status.push({ name: "Email (Brevo)", note: emailAt ? `Last email sent ${agoText(emailAt)}` : "No email recorded yet", ok: failed === 0 });
    status.push({ name: "Push messages", note: pushAt ? `Last push sent ${agoText(pushAt)}` : "No push recorded yet", ok: failed === 0 });
    const m = minutesAgo(o.reminders?.at);
    const stale = m === null || m > 90 || (o.reminders && o.reminders.status !== "succeeded");
    status.push({ name: "Scheduled reminders", note: o.reminders ? `Last run ${agoText(o.reminders.at)}` : "Has not run yet", ok: !stale });
  }
  return { data: o, status };
}

/** Writes one line to the audit log. Never blocks the action it describes. */
export async function logAdminAction(action: string, target?: string | null): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("log_admin_action", { p_action: action, p_target: target ?? null });
  } catch (e) {
    console.error("audit log failed:", e instanceof Error ? e.message : e);
  }
}
