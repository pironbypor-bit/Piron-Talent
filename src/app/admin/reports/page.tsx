import type { Metadata } from "next";
import Link from "next/link";
import { Button, Notice, PageTitle, Pill, inputClass } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { statusLabel, statusTone } from "@/lib/pilot";
import { requireAdmin } from "../guard";
import { setReportStatus } from "./actions";

export const metadata: Metadata = { title: "Admin" };

type Row = { id: string; target_type: string; target_id: string; reason: string; status: string; note: string | null; created_at: string; reporter: { display_name: string } | { display_name: string }[] | null };

const TARGET_PATH: Record<string, (id: string) => string | null> = {
  post: (id) => `/app/post/${id}`,
  user: (id) => `/app/providers/${id}`,
  job: (id) => `/app/jobs/${id}`,
  comment: () => null,
  message: () => null,
};

/** Reports queue: open and reviewing first, then the last closed ones. Each row links to the reported thing. */
export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [t, locale, { supabase, isAdmin }, { error }] = await Promise.all([getT(), getLocale(), requireAdmin(), searchParams]);
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">{t("Not allowed.")}</Notice>
      </main>
    );
  }
  const { data } = await supabase.from("reports").select("id,target_type,target_id,reason,status,note,created_at,reporter:profiles!reports_reporter_id_fkey(display_name)").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as unknown as Row[];
  const open = rows.filter((r) => r.status === "open" || r.status === "reviewing");
  const closed = rows.filter((r) => r.status !== "open" && r.status !== "reviewing").slice(0, 30);
  const who = (r: Row) => (Array.isArray(r.reporter) ? r.reporter[0]?.display_name : r.reporter?.display_name) ?? "?";
  const TYPE: Record<string, string> = { post: "Post", user: "Person", job: "Job", comment: "Comment", message: "Message" };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-6">
        <Link href="/admin" className="text-sm font-medium underline">{t("Back")}</Link>
      </p>
      <PageTitle lead={`${open.length} ${t("Open").toLowerCase()}`}>{t("Reports")}</PageTitle>
      {error && <div className="mb-6"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}
      {open.length === 0 && <p className="text-ink-muted">{t("Nothing yet.")}</p>}
      <ul className="space-y-4">
        {open.map((r) => {
          const href = TARGET_PATH[r.target_type]?.(r.target_id) ?? null;
          return (
            <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {t(TYPE[r.target_type] ?? r.target_type)}
                    {href ? (
                      <> · <Link href={href} className="underline">{t("Open")}</Link></>
                    ) : (
                      <span className="font-normal text-ink-muted"> · {r.target_id}</span>
                    )}
                  </p>
                  <p className="text-sm text-ink-muted">{t("By {name}", { name: who(r) })} · {formatDate(r.created_at, locale)}</p>
                  <p className="mt-2 text-sm">{r.reason}</p>
                </div>
                <Pill tone={statusTone(r.status)}>{statusLabel(t, r.status)}</Pill>
              </div>
              <form action={setReportStatus} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="note" defaultValue={r.note ?? ""} placeholder={t("Note")} className={`${inputClass} min-w-40 flex-1 py-1.5 text-sm`} />
                {r.status === "open" && <Button type="submit" name="status" value="reviewing" variant="secondary" className="px-3 py-1.5 text-sm">{t("Reviewing")}</Button>}
                <Button type="submit" name="status" value="resolved" className="px-3 py-1.5 text-sm">{t("Resolved")}</Button>
                <Button type="submit" name="status" value="dismissed" variant="secondary" className="px-3 py-1.5 text-sm">{t("Dismiss")}</Button>
              </form>
            </li>
          );
        })}
      </ul>
      {closed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("Closed")}</h2>
          <ul className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200">
            {closed.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{t(TYPE[r.target_type] ?? r.target_type)} · {formatDate(r.created_at, locale)}</p>
                  <p className="text-ink-muted">{r.reason}</p>
                  {r.note && <p className="mt-1">{r.note}</p>}
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
