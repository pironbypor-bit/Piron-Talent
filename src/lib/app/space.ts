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
export async function getSpaceOverview(): Promise<{ data: SpaceOverview | null; status: StatusRow[]; errors: { open: number; repeating: number } }> {
  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const t0 = Date.now();
  const [{ data, error }, auth, storage, badge] = await Promise.all([
    supabase.rpc("space_overview"),
    reachable(`${base}/auth/v1/health`, anon),
    reachable(`${base}/storage/v1/bucket`, anon),
    getErrorBadge(),
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
  return { data: o, status, errors: badge ?? { open: 0, repeating: 0 } };
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

// People (migration 0047) ---------------------------------------------------------------------------------

export type PeopleSummary = {
  total: number; new_7d: number; new_30d: number; providers: number; identity_checked: number; paused: number; active_7d: number;
  growth: { day: string; n: number }[];
  cities: { city: string; n: number }[];
};

export type PersonRow = {
  id: string; display_name: string; role_line: string | null; city: string | null; created_at: string;
  is_available: boolean; identity_checked: boolean; paused_at: string | null; last_sign_in_at: string | null;
  posts: number; jobs: number;
};

export type PersonDetail = {
  id: string; display_name: string; role_line: string | null; bio: string | null; city: string | null; district: string | null;
  created_at: string; is_available: boolean; identity_checked: boolean; completed_jobs: number; paused_at: string | null; is_admin: boolean;
  last_sign_in_at: string | null; posts: number; quotes: number; jobs_as_customer: number; jobs_as_provider: number;
  reviews: number; avg_stars: number | null; reports_against: number; reports_filed: number; companies: number;
  recent_posts: { id: string; title: string; kind: string; status: string; created_at: string }[];
};

export const PEOPLE_FILTERS = ["all", "providers", "checked", "new", "paused"] as const;
export type PeopleFilter = (typeof PEOPLE_FILTERS)[number];

export async function getPeopleSummary(): Promise<PeopleSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_people_summary");
  return error ? null : (data as PeopleSummary | null);
}

export async function getPeople(q: string, filter: PeopleFilter): Promise<PersonRow[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_people", { p_q: q, p_filter: filter, p_limit: 60 });
  return error ? null : (data as PersonRow[] | null);
}

export async function getPerson(id: string): Promise<PersonDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_person", { p_id: id });
  return error ? null : (data as PersonDetail | null);
}

// Marketplace health (migration 0048) ----------------------------------------------------------------------

export type Funnel = { projects: number; with_quote: number; accepted: number; delivered: number; confirmed: number; cancelled: number };
export type MarketplaceHealth = {
  funnel_all: Funnel; funnel_30d: Funnel;
  hours_to_first_quote: number | null; avg_stars: number | null; reviews: number;
  quotes_waiting_2d: number; no_quote_3d: number;
  stuck: { id: string; post_id: string; title: string; status: string; days: number; customer: string | null; provider: string | null }[];
  categories: { name: string; posts: number; providers: number }[];
  cities: { city: string; posts: number; providers: number }[];
};

export async function getMarketplace(): Promise<MarketplaceHealth | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_marketplace");
  return error ? null : (data as MarketplaceHealth | null);
}

// Errors (migration 0049) -----------------------------------------------------------------------------------

export type ErrorStatus = "open" | "fixed" | "ignored";
export const ERROR_FILTERS = ["open", "fixed", "ignored", "all"] as const;
export type ErrorFilter = (typeof ERROR_FILTERS)[number];

export type ErrorRow = {
  id: number; source: string; message: string; path: string | null; count: number;
  first_seen: string; last_seen: string; status: ErrorStatus; last_person: string | null;
};
export type SendLog = { failed: { at: string; status: number | null; note: string }[]; reminders: { at: string; status: string }[] };

export async function getErrors(filter: ErrorFilter): Promise<ErrorRow[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_errors", { p_status: filter });
  return error ? null : (data as ErrorRow[] | null);
}

export async function getErrorBadge(): Promise<{ open: number; repeating: number } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_errors_badge");
  return error ? null : (data as { open: number; repeating: number } | null);
}

export async function getSendLog(): Promise<SendLog | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_send_log");
  return error ? null : (data as SendLog | null);
}

// Feature switches (migration 0050) -------------------------------------------------------------------------

export type FeatureMode = "off" | "owner" | "people" | "everyone";
export type FeatureRow = { key: string; title: string; description: string; mode: FeatureMode; updated_at: string; people: { id: string; name: string }[] };
export type FeatureLogRow = { at: string; action: string; target: string | null };

export async function getFeatureRows(): Promise<FeatureRow[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_features");
  return error ? null : (data as FeatureRow[] | null);
}

export async function getFeatureLog(): Promise<FeatureLogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("space_feature_log");
  return (data as FeatureLogRow[] | null) ?? [];
}

// Money (migration 0051) --------------------------------------------------------------------------------------

export const INCOME_TYPES = ["Service fee", "Subscription", "Paid listing", "Advertising", "Other income"] as const;
export const COST_TYPES = ["Cloudflare", "Supabase", "Email (Brevo)", "Domain names", "Phone and internet", "Legal and accounting", "Marketing", "Other cost"] as const;

export type MoneyEntry = { id: number; kind: "income" | "cost"; type: string; amount: number; note: string | null; repeats: boolean; starts: string; ends: string | null };
export type MoneyMonth = { month: string; revenue: number; costs: number; volume: number };
export type MoneyView = { month: string; entries: MoneyEntry[]; volume: number; months: MoneyMonth[] };
export type MoneyExportRow = { month: string; kind: "income" | "cost"; type: string; amount: number; note: string | null; repeats: boolean };

export async function getMoney(month: string | null): Promise<MoneyView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_money", { p_month: month });
  return error ? null : (data as MoneyView | null);
}

export async function getMoneyExport(months = 12): Promise<MoneyExportRow[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("space_money_export", { p_months: months });
  return error ? null : (data as MoneyExportRow[] | null);
}

/** Month options for the picker: this month and the 11 before it, as YYYY-MM-01 (Phnom Penh time). */
export function recentMonths(n = 12): string[] {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`);
  }
  return out;
}

export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}
