import type { Metadata } from "next";
import Link from "next/link";
import { Button, Notice, PageTitle, Pill, inputClass } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { statusLabel, statusTone } from "@/lib/pilot";
import { requireAdmin } from "../guard";
import { resolveDispute } from "./actions";

export const metadata: Metadata = { title: "Admin" };

type Person = { display_name: string } | { display_name: string }[] | null;
type Row = { id: string; quote_id: string | null; booking_id: string | null; reason: string; status: string; resolution: string | null; created_at: string; opener: Person; against: Person };
type JobRef = { quote_id: string; post_id: string; agreed_price: number; status: string; posts: { title: string } | { title: string }[] | null };

/** Disputes queue: who opened it, against whom, the job it belongs to, and the resolution form. */
export default async function DisputesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [t, locale, { supabase, isAdmin }, { error }] = await Promise.all([getT(), getLocale(), requireAdmin(), searchParams]);
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">{t("Not allowed.")}</Notice>
      </main>
    );
  }
  const { data } = await supabase
    .from("disputes")
    .select("id,quote_id,booking_id,reason,status,resolution,created_at,opener:profiles!disputes_opened_by_fkey(display_name),against:profiles!disputes_against_id_fkey(display_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const quoteIds = rows.map((r) => r.quote_id).filter((x): x is string => !!x);
  const { data: jobs } = quoteIds.length ? await supabase.from("project_jobs").select("quote_id,post_id,agreed_price,status,posts(title)").in("quote_id", quoteIds) : { data: [] };
  const jobByQuote = new Map(((jobs ?? []) as unknown as JobRef[]).map((j) => [j.quote_id, j]));
  const name = (p: Person) => (Array.isArray(p) ? p[0]?.display_name : p?.display_name) ?? "?";
  const title = (j: JobRef | undefined) => (j ? (Array.isArray(j.posts) ? j.posts[0]?.title : j.posts?.title) ?? "" : "");
  const open = rows.filter((r) => r.status === "open" || r.status === "reviewing");
  const closed = rows.filter((r) => r.status !== "open" && r.status !== "reviewing").slice(0, 30);

  const Head = ({ r }: { r: Row }) => {
    const j = r.quote_id ? jobByQuote.get(r.quote_id) : undefined;
    return (
      <div className="min-w-0">
        <p className="font-semibold">
          {name(r.opener)} <span className="font-normal text-ink-muted">{t("against")}</span> {name(r.against)}
        </p>
        <p className="text-sm text-ink-muted">
          {formatDate(r.created_at, locale)}
          {j && (
            <>
              {" · "}
              <Link href={`/app/post/${j.post_id}`} className="underline">{title(j) || t("Job")}</Link> · ${j.agreed_price} · {statusLabel(t, j.status)}
            </>
          )}
        </p>
        <p className="mt-2 text-sm">{r.reason}</p>
      </div>
    );
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-6">
        <Link href="/admin" className="text-sm font-medium underline">{t("Back")}</Link>
      </p>
      <PageTitle lead={`${open.length} ${t("Open").toLowerCase()}`}>{t("Disputes")}</PageTitle>
      {error && <div className="mb-6"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}
      {open.length === 0 && <p className="text-ink-muted">{t("Nothing yet.")}</p>}
      <ul className="space-y-4">
        {open.map((r) => (
          <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <Head r={r} />
              <Pill tone={statusTone(r.status)}>{statusLabel(t, r.status)}</Pill>
            </div>
            <form action={resolveDispute} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={r.id} />
              <textarea name="resolution" rows={2} defaultValue={r.resolution ?? ""} placeholder={t("Resolution, sent to both sides")} className={`${inputClass} text-sm`} />
              <div className="flex flex-wrap gap-2">
                {r.status === "open" && <Button type="submit" name="status" value="reviewing" variant="secondary" className="px-3 py-1.5 text-sm">{t("Reviewing")}</Button>}
                <Button type="submit" name="status" value="resolved" className="px-3 py-1.5 text-sm">{t("Resolved")}</Button>
                <Button type="submit" name="status" value="dismissed" variant="secondary" className="px-3 py-1.5 text-sm">{t("Dismiss")}</Button>
              </div>
            </form>
          </li>
        ))}
      </ul>
      {closed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("Closed")}</h2>
          <ul className="mt-3 space-y-3">
            {closed.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <Head r={r} />
                  {r.resolution && <p className="mt-2 rounded-lg bg-stone-50 p-2">{r.resolution}</p>}
                </div>
                <Pill tone={statusTone(r.status)}>{statusLabel(t, r.status)}</Pill>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
