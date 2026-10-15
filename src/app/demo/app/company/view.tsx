"use client";

import { useState } from "react";
import { Briefcase, CalendarClock, Download, FileImage, FileText, Flag, Globe, Lock, Megaphone, Upload, Users } from "lucide-react";
import { Notice, Pill } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { activity, initialDocs, viewers, type Activity, type Doc, type Level } from "@/lib/demo/company-fixtures";

// Demo: a company Documents area (private, team, public) and the public company page.
// Switch "View as" to see the owner, a manager, a member and a visitor. State lives here only; reload resets it.

type Tab = "documents" | "page";

const LEVELS: { key: Level; label: string; hint: string; Icon: typeof Lock }[] = [
  { key: "private", label: "Private", hint: "Owner and managers", Icon: Lock },
  { key: "team", label: "Team", hint: "Everyone in the team", Icon: Users },
  { key: "public", label: "Public", hint: "Anyone, no login", Icon: Globe },
];

const KIND_ICON: Record<Activity["kind"], typeof Briefcase> = { job: Briefcase, project: FileText, activity: CalendarClock, invite: Megaphone };
const KIND_LABEL: Record<Activity["kind"], string> = { job: "Job", project: "Project", activity: "Volunteer activity", invite: "Invitation" };
const KIND_CTA: Record<Activity["kind"], string> = { job: "View job", project: "View project", activity: "Join activity", invite: "Open invitation" };

function LevelPill({ level }: { level: Level }) {
  const t = useT();
  const l = LEVELS.find((x) => x.key === level)!;
  return <Pill tone={level === "public" ? "green" : level === "team" ? "amber" : "neutral"}>{t(l.label)}</Pill>;
}

export function CompanyDemo() {
  const t = useT();
  const [viewAs, setViewAs] = useState("sophea");
  const [tab, setTab] = useState<Tab>("documents");
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [pageOn, setPageOn] = useState(true);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [added, setAdded] = useState(0);
  const viewer = viewers.find((v) => v.id === viewAs)!;
  const admin = viewer.role === "owner" || viewer.role === "manager";
  const owner = viewer.role === "owner";
  const visitor = viewer.role === "visitor";
  const activeTab: Tab = visitor ? "page" : tab;

  const visible = docs.filter((d) => admin || d.level === "public" || (viewer.role === "member" && d.level === "team"));
  const publicDocs = docs.filter((d) => d.level === "public");
  const setLevel = (id: string, level: Level) => {
    if (level === "public") return setConfirm(id);
    setDocs((all) => all.map((d) => (d.id === id ? { ...d, level } : d)));
  };
  const publish = () => {
    setDocs((all) => all.map((d) => (d.id === confirm ? { ...d, level: "public" } : d)));
    setConfirm(null);
  };
  const upload = () => {
    const n = added + 1;
    setAdded(n);
    setDocs((all) => [{ id: `n${n}`, name: `New file ${n}.pdf`, kind: "pdf", size: "200 KB", updated: "Today", level: "private" }, ...all]);
  };
  const remove = (id: string) => setDocs((all) => all.filter((d) => d.id !== id));
  const count = (l: Level) => docs.filter((d) => d.level === l).length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold leading-tight">Sophea Café</h1>
          <p className="text-sm text-ink-muted">{t("Phnom Penh")}</p>
        </div>
        <label className="text-xs text-ink-muted">
          {t("View as")}
          <select value={viewAs} onChange={(e) => { setViewAs(e.target.value); setConfirm(null); }} className="ml-1 max-w-[9.5rem] rounded-full border border-stone-300 bg-white px-2 py-1 text-xs text-ink">
            {viewers.map((v) => <option key={v.id} value={v.id}>{t(v.label)}</option>)}
          </select>
        </label>
      </div>

      {!visitor && (
        <div className="mt-3 flex gap-2">
          {([["documents", "Documents"], ["page", "Public page"]] as [Tab, string][]).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${tab === k ? "border-ink bg-ink text-white" : "border-stone-300 bg-white"}`}>{t(label)}</button>
          ))}
        </div>
      )}

      <div className="mt-3"><Notice tone="info">{t("Demo with sample data. These features are not built yet. Nothing here is saved.")}</Notice></div>

      {activeTab === "documents" && (
        <div className="mt-3 space-y-3">
          <section className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{t("Documents")}</h2>
                <p className="text-sm text-ink-muted">
                  {admin ? t("{a} public · {b} team · {c} private", { a: count("public"), b: count("team"), c: count("private") }) : t("Files the company shared with you.")}
                </p>
              </div>
              {admin && (
                <button type="button" onClick={upload} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-brand-400">
                  <Upload className="size-4" />{t("Add a file")}
                </button>
              )}
            </div>
            {admin && <p className="mt-2 text-xs text-ink-muted">{t("New files start as Private. PDF and images, up to 5 MB.")}</p>}
          </section>

          {confirm && (
            <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">{t("Make this file public?")}</p>
              <p className="mt-1">{t("Anyone who opens your company page can read it, even without an account. Do not publish ID numbers, bank details or private information.")}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={publish} className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-white">{t("Publish")}</button>
                <button type="button" onClick={() => setConfirm(null)} className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-medium">{t("Cancel")}</button>
              </div>
            </section>
          )}

          {visible.length === 0 ? (
            <p className="card p-4 text-sm text-ink-muted">{t("No files yet.")}</p>
          ) : (
            <ul className="space-y-2">
              {visible.map((d) => {
                const Icon = d.kind === "pdf" ? FileText : FileImage;
                return (
                  <li key={d.id} className="card p-3">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{d.name}</p>
                        <p className="text-xs text-ink-muted">{d.size} · {t("Updated {date}", { date: d.updated })}</p>
                      </div>
                      <LevelPill level={d.level} />
                    </div>
                    {admin ? (
                      <div className="mt-3">
                        <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={t("Who can see this file")}>
                          {LEVELS.map(({ key, label, Icon: LIcon }) => {
                            const locked = key === "public" && !owner;
                            const on = d.level === key;
                            return (
                              <button key={key} type="button" role="radio" aria-checked={on} disabled={locked} onClick={() => setLevel(d.id, key)}
                                className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-xs font-medium ${on ? "border-ink bg-ink text-white" : "border-stone-300 bg-white"} ${locked ? "opacity-40" : ""}`}>
                                <LIcon className="size-3.5" />{t(label)}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-ink-muted">
                          <span>{t(LEVELS.find((l) => l.key === d.level)!.hint)}{!owner && ` · ${t("Only the owner can make a file public.")}`}</span>
                          <button type="button" onClick={() => remove(d.id)} className="shrink-0 underline">{t("Delete")}</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline"><Download className="size-4" />{t("Download")}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {activeTab === "page" && (
        <div className="mt-3 space-y-3">
          {admin && (
            <section className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t("Show the company page to everyone")}</p>
                <p className="text-sm text-ink-muted">{pageOn ? t("This is what a visitor sees below.") : t("Visitors see that the page is not public.")}</p>
              </div>
              <button type="button" role="switch" aria-checked={pageOn} aria-label={t("Show the company page to everyone")} onClick={() => setPageOn(!pageOn)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${pageOn ? "bg-emerald-500" : "bg-stone-300"}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${pageOn ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </section>
          )}

          {!pageOn ? (
            <p className="card p-5 text-center text-ink-muted">{t("This company page is not public.")}</p>
          ) : (
            <>
              <section className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-200 text-xl font-bold text-brand-900" aria-hidden="true">S</span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-tight">Sophea Café</h2>
                    <p className="text-sm text-ink-muted">{t("Phnom Penh")} · {t("Cafe")}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5"><Pill tone="green">{t("Owner identity checked")}</Pill></div>
                <p className="mt-3 text-sm leading-relaxed">{t("A small neighbourhood cafe. We hire part-time staff and work with local designers and photographers.")}</p>
              </section>

              <section>
                <h3 className="px-1 text-sm font-semibold text-ink-muted">{t("Recent activity")}</h3>
                <ul className="mt-2 space-y-2">
                  {activity.map((a) => {
                    const Icon = KIND_ICON[a.kind];
                    return (
                      <li key={a.id} className="card flex items-start gap-3 p-3">
                        <Icon className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-ink-muted">{t(KIND_LABEL[a.kind])} · {t(a.when)}</p>
                          <p className="font-medium">{t(a.title)}</p>
                          <p className="text-sm text-ink-muted">{t(a.meta)}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-stone-300 px-3 py-1 text-xs font-medium">{t(KIND_CTA[a.kind])}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section>
                <h3 className="px-1 text-sm font-semibold text-ink-muted">{t("Shared documents")}</h3>
                {publicDocs.length === 0 ? (
                  <p className="card mt-2 p-4 text-sm text-ink-muted">{t("This company has not shared any documents.")}</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {publicDocs.map((d) => {
                      const Icon = d.kind === "pdf" ? FileText : FileImage;
                      return (
                        <li key={d.id} className="card flex items-center gap-3 p-3">
                          <Icon className="size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                          <div className="min-w-0 flex-1"><p className="truncate font-medium">{d.name}</p><p className="text-xs text-ink-muted">{d.size}</p></div>
                          <span className="inline-flex items-center gap-1 text-sm font-medium underline"><Download className="size-4" />{t("Download")}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <p className="px-1 text-xs text-ink-muted"><Flag className="mr-1 inline size-3.5" />{t("Report this page")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
