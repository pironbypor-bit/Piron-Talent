import type { Metadata } from "next";
import { Notice } from "@/components/ui";
import { Dropdown } from "@/components/dropdown";
import { ERROR_FILTERS, agoText, getErrors, getSendLog, type ErrorFilter } from "@/lib/app/space";
import { SpaceNav } from "../space-nav";
import { sendTestError, setErrorStatus } from "./actions";

export const metadata: Metadata = { title: "Errors - Piron Work Space" };
export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";
const FILTER_LABEL: Record<ErrorFilter, string> = { open: "Open", fixed: "Fixed", ignored: "Ignored", all: "All" };
const SOURCE_LABEL: Record<string, string> = { page: "Page", action: "Button or form", route: "Background call", job: "Scheduled job", browser: "On the phone" };

/** Piron Work Space, step 4: what failed, grouped, with a way to close it. Also failed sends and reminder runs. */
export default async function ErrorsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "open" } = await searchParams;
  const active = (ERROR_FILTERS as readonly string[]).includes(filter) ? (filter as ErrorFilter) : "open";
  const [errors, sends] = await Promise.all([getErrors(active), getSendLog()]);
  if (!errors || !sends) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">Not allowed.</Notice>
      </main>
    );
  }
  const btn = "rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-brand-50";

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <SpaceNav active="errors" />
        <div className="space-y-4">
          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">App errors</h2>
                <p className="text-xs text-ink-muted">The same error is grouped into one line with a count. You get a message when one repeats 5 times in 10 minutes. Closed errors reopen if they happen again. Kept 60 days.</p>
              </div>
              <form method="get" action="/admin/space/errors">
                <Dropdown compact submitOnChange name="filter" defaultValue={active} label="Show" className="w-36" options={ERROR_FILTERS.map((f) => ({ value: f, label: FILTER_LABEL[f] }))} />
              </form>
            </div>
            {errors.length === 0 ? (
              <p className="mt-4 text-sm text-green-800">{active === "open" ? "No open errors." : "Nothing here."}</p>
            ) : (
              <ul className="mt-3 divide-y divide-stone-100">
                {errors.map((e) => (
                  <li key={e.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium">{e.message}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {SOURCE_LABEL[e.source] ?? e.source}{e.path ? ` · ${e.path}` : ""}{e.last_person ? ` · last: ${e.last_person}` : ""}
                        </p>
                        <p className="text-xs text-ink-muted">First {agoText(e.first_seen)} · last {agoText(e.last_seen)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.status === "open" ? "bg-amber-100 text-amber-900" : "bg-stone-100 text-ink-muted"}`}>{e.count} × · {e.status}</span>
                        <form action={setErrorStatus} className="flex gap-1">
                          <input type="hidden" name="id" value={e.id} />
                          <input type="hidden" name="back" value={active} />
                          {e.status !== "fixed" && <button name="status" value="fixed" className={btn}>Fixed</button>}
                          {e.status !== "ignored" && <button name="status" value="ignored" className={btn}>Ignore</button>}
                          {e.status !== "open" && <button name="status" value="open" className={btn}>Reopen</button>}
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold">Check that the alarm works</h2>
            <p className="text-xs text-ink-muted">Sends one made-up error. You will see an error screen, then a line here saying &ldquo;Test error from Piron Work Space&rdquo;. Mark it fixed afterwards.</p>
            <form action={sendTestError} className="mt-2">
              <button type="submit" className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-brand-50">Send a test error</button>
            </form>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className={card}>
              <h2 className="text-sm font-semibold">Failed emails and push messages</h2>
              {sends.failed.length === 0 ? (
                <p className="mt-2 text-sm text-green-800">None recorded.</p>
              ) : (
                <ul className="mt-2 divide-y divide-stone-100 text-sm">
                  {sends.failed.map((f, i) => (
                    <li key={i} className="py-2">
                      <p className="text-xs text-ink-muted">{agoText(f.at)} · status {f.status ?? "none"}</p>
                      <p className="break-words">{f.note || "No detail"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={card}>
              <h2 className="text-sm font-semibold">Reminder runs</h2>
              <p className="text-xs text-ink-muted">Every 30 minutes.</p>
              <ul className="mt-2 divide-y divide-stone-100 text-sm">
                {sends.reminders.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-1.5">
                    <span>{agoText(r.at)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "succeeded" ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"}`}>{r.status}</span>
                  </li>
                ))}
                {sends.reminders.length === 0 && <li className="py-2 text-ink-muted">No runs recorded.</li>}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
