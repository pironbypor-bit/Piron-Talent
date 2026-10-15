import type { Metadata } from "next";
import Link from "next/link";
import { Button, Notice, PageTitle, Pill, inputClass } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { requireAdmin } from "../guard";
import { reviewPayoutAccount } from "./actions";

export const metadata: Metadata = { title: "Admin" };

type Prof = { display_name: string; identity_checked: boolean };
type Row = { user_id: string; method: string; account_name: string; account_number: string; status: string; note: string | null; updated_at: string; profiles: Prof | Prof[] | null };

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(" ").sort().join(" ");

/** Payout accounts waiting for review: the account holder name next to the legal name from the approved ID check. */
export default async function PayoutAccountsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [t, locale, { supabase, isAdmin }, { error }] = await Promise.all([getT(), getLocale(), requireAdmin(), searchParams]);
  if (!isAdmin) return <main className="mx-auto max-w-3xl px-4 py-12"><Notice tone="error">{t("Not allowed.")}</Notice></main>;
  const { data } = await supabase
    .from("payout_accounts")
    .select("user_id,method,account_name,account_number,status,note,updated_at,profiles!payout_accounts_user_id_fkey(display_name,identity_checked)")
    .order("updated_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as unknown as Row[];
  const ids = rows.map((r) => r.user_id);
  const legal = new Map<string, string>();
  if (ids.length) {
    const { data: checks } = await supabase.from("identity_checks").select("user_id,legal_name,created_at").in("user_id", ids).eq("status", "checked").order("created_at", { ascending: false });
    for (const c of (checks ?? []) as { user_id: string; legal_name: string | null }[]) if (c.legal_name && !legal.has(c.user_id)) legal.set(c.user_id, c.legal_name);
  }
  const prof = (r: Row) => (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles);
  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending").slice(0, 20);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-6"><Link href="/admin" className="text-sm font-medium underline">{t("Back")}</Link></p>
      <PageTitle lead={t("Check that the account holder name is the same person as the ID. Nothing here moves money.")}>{t("Payout accounts")}</PageTitle>
      {error && <div className="mb-6"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}

      <h2 className="text-xl font-bold">{t("Waiting for review")} · {pending.length}</h2>
      {pending.length === 0 && <p className="mt-2 text-ink-muted">{t("Nothing yet.")}</p>}
      <ul className="mt-3 space-y-4">
        {pending.map((r) => {
          const p = prof(r);
          const legalName = legal.get(r.user_id);
          const match = legalName ? norm(legalName) === norm(r.account_name) : null;
          return (
            <li key={r.user_id} className="rounded-2xl border border-stone-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{p?.display_name ?? r.user_id}</span>
                <Pill tone={p?.identity_checked ? "green" : "red"}>{p?.identity_checked ? t("Identity checked") : t("Identity not checked")}</Pill>
                {match !== null && <Pill tone={match ? "green" : "amber"}>{match ? t("Names match") : t("Names differ")}</Pill>}
                <span className="text-xs text-ink-muted">{formatDate(r.updated_at, locale)}</span>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-ink-muted">{t("Name on the ID")}</dt><dd className="font-medium">{legalName ?? "-"}</dd></div>
                <div><dt className="text-xs text-ink-muted">{t("Account holder name")}</dt><dd className="font-medium">{r.account_name}</dd></div>
                <div><dt className="text-xs text-ink-muted">{t("Account type")}</dt><dd>{r.method.toUpperCase()}</dd></div>
                <div><dt className="text-xs text-ink-muted">{t("Account number or phone")}</dt><dd>{r.account_number}</dd></div>
              </dl>
              <form action={reviewPayoutAccount} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="user" value={r.user_id} />
                <input name="note" placeholder={t("Note to the person (optional)")} maxLength={300} className={`${inputClass} min-w-0 flex-1 py-1.5 text-sm`} />
                <Button type="submit" name="decision" value="approve" className="px-4 py-1.5 text-sm">{t("Approve")}</Button>
                <Button type="submit" name="decision" value="reject" variant="secondary" className="px-4 py-1.5 text-sm">{t("Reject")}</Button>
              </form>
            </li>
          );
        })}
      </ul>

      {done.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-bold">{t("Recently reviewed")}</h2>
          <ul className="mt-3 divide-y divide-stone-200 rounded-2xl border border-stone-200">
            {done.map((r) => (
              <li key={r.user_id} className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm">
                <span className="font-medium">{prof(r)?.display_name ?? r.user_id}</span>
                <Pill tone={r.status === "approved" ? "green" : "red"}>{r.status === "approved" ? t("Approved") : t("Not approved")}</Pill>
                <span className="text-ink-muted">{r.account_name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
