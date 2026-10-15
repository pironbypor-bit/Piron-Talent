import type { Metadata } from "next";
import { Notice } from "@/components/ui";
import { Dropdown } from "@/components/dropdown";
import { agoText, getFeatureLog, getFeatureRows, getPeople, type FeatureMode } from "@/lib/app/space";
import { SpaceNav } from "../space-nav";
import { setFeatureMode, setFeaturePerson } from "./actions";

export const metadata: Metadata = { title: "Features - Piron Work Space" };
export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";
const MODES: { value: FeatureMode; label: string; hint: string }[] = [
  { value: "off", label: "Off", hint: "Nobody sees it, not even you" },
  { value: "owner", label: "Only me", hint: "Only your account, to try it live" },
  { value: "people", label: "Chosen people", hint: "You and the people you pick" },
  { value: "everyone", label: "Everyone", hint: "Released" },
];
const MODE_TONE: Record<FeatureMode, string> = { off: "bg-stone-200 text-ink", owner: "bg-amber-100 text-amber-900", people: "bg-blue-100 text-blue-900", everyone: "bg-green-100 text-green-900" };

/** Piron Work Space, step 5: one switch per feature. Try a new feature on yourself before anyone else sees it. */
export default async function FeaturesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const [rows, log, people] = await Promise.all([getFeatureRows(), getFeatureLog(), getPeople("", "all")]);
  if (!rows) {
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
        <SpaceNav active="features" />
        <div className="space-y-4">
          {error && <Notice tone="error">That did not work. Please try again.</Notice>}
          <p className="text-sm text-ink-muted">Each feature has one switch. A change takes effect on the next page the person opens. Every change is written to the log below.</p>

          {rows.map((f) => {
            const chosen = new Set(f.people.map((p) => p.id));
            const addable = (people ?? []).filter((p) => !chosen.has(p.id));
            return (
              <section key={f.key} className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{f.title}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${MODE_TONE[f.mode]}`}>{MODES.find((m) => m.value === f.mode)?.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{f.description}</p>
                    <p className="mt-1 text-xs text-ink-muted">Key: {f.key} · changed {agoText(f.updated_at)}</p>
                  </div>
                  <form action={setFeatureMode} className="w-52 shrink-0">
                    <input type="hidden" name="key" value={f.key} />
                    <Dropdown submitOnChange small name="mode" defaultValue={f.mode} label={`Who sees ${f.title}`} options={MODES.map((m) => ({ value: m.value, label: m.label, hint: m.hint }))} />
                  </form>
                </div>

                {f.mode === "people" && (
                  <div className="mt-4 border-t border-stone-100 pt-3">
                    <p className="text-sm font-medium">Chosen people</p>
                    {f.people.length === 0 ? (
                      <p className="mt-1 text-sm text-ink-muted">Nobody yet. Only you can see it.</p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {f.people.map((p) => (
                          <li key={p.id}>
                            <form action={setFeaturePerson} className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1 text-sm">
                              <input type="hidden" name="key" value={f.key} />
                              <input type="hidden" name="user" value={p.id} />
                              <input type="hidden" name="add" value="0" />
                              {p.name}
                              <button className="rounded-full px-2 text-xs font-semibold hover:bg-blue-100" aria-label={`Remove ${p.name}`}>Remove</button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                    {addable.length > 0 && (
                      <form action={setFeaturePerson} className="mt-3 flex items-center gap-2">
                        <input type="hidden" name="key" value={f.key} />
                        <input type="hidden" name="add" value="1" />
                        <Dropdown small name="user" defaultValue={addable[0].id} label="Add a person" className="min-w-0 flex-1" options={addable.map((p) => ({ value: p.id, label: p.display_name, hint: p.role_line ?? undefined }))} />
                        <button type="submit" className={btn}>Add</button>
                      </form>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          <section className={card}>
            <h2 className="text-sm font-semibold">Change log</h2>
            {log.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">No changes yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-stone-100 text-sm">
                {log.map((l, i) => (
                  <li key={i} className="flex gap-3 py-2">
                    <span className="w-28 shrink-0 text-xs text-ink-muted">{agoText(l.at)}</span>
                    <span>{l.action}{l.target ? ` · ${l.target}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-ink-muted">
            <p className="font-medium text-ink">Adding a new switch</p>
            <p className="mt-1">A new feature gets a row in the feature list (one small database change) and is wrapped in the code, so it starts as Off. Ask for it when the feature is built.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
