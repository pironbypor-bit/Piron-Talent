import type { Metadata } from "next";
import { Notice } from "@/components/ui";
import { Dropdown } from "@/components/dropdown";
import { AUDIT_FILTERS, agoText, getAudit } from "@/lib/app/space";
import { SpaceNav } from "../space-nav";

export const metadata: Metadata = { title: "Audit log - Piron Work Space" };
export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";

/** Piron Work Space, step 7: every admin action, newest first. Written by the database, not editable. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "" } = await searchParams;
  const active = AUDIT_FILTERS.some((f) => f.value === filter) ? filter : "";
  const rows = await getAudit(active);
  if (!rows) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">Not allowed.</Notice>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <SpaceNav active="audit" />
        <section className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Audit log</h2>
              <p className="text-xs text-ink-muted">Everything an admin did, newest first. The last 200 are shown. Nobody can edit or delete lines.</p>
            </div>
            <form method="get" action="/admin/space/audit" className="w-60">
              <Dropdown small submitOnChange name="filter" defaultValue={active} label="Show" options={AUDIT_FILTERS.map((f) => ({ value: f.value, label: f.label }))} />
            </form>
          </div>
          {rows.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Nothing recorded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {rows.map((r, i) => (
                <li key={i} className="flex flex-wrap gap-x-3 gap-y-0.5 py-2">
                  <span className="w-28 shrink-0 text-xs text-ink-muted" title={r.at}>{agoText(r.at)}</span>
                  <span className="min-w-0 flex-1 break-words"><span className="font-medium">{r.action}</span>{r.target ? ` · ${r.target}` : ""}</span>
                  <span className="shrink-0 text-xs text-ink-muted">{r.actor ?? "system"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
