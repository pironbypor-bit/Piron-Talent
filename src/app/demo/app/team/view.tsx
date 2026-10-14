"use client";

import { useState } from "react";
import { BadgeCheck, CalendarDays, CheckSquare, Users, Wallet } from "lucide-react";
import { Button, Notice, Pill, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { DAYS, TODAY, hoursOf, initialShifts, initialTasks, people, type Person, type Shift, type Task, type TaskStatus } from "@/lib/demo/team-fixtures";

// Demo of the four team features that do not exist yet. Switch "View as" to see what the owner and a member see.
// State lives in this component only; reload and everything is back to the sample data.

type Tab = "team" | "schedule" | "tasks" | "pay" | "public";
const TABS: { key: Tab; label: string; Icon: typeof Users }[] = [
  { key: "team", label: "Team", Icon: Users },
  { key: "schedule", label: "Schedule", Icon: CalendarDays },
  { key: "tasks", label: "Tasks", Icon: CheckSquare },
  { key: "pay", label: "Pay", Icon: Wallet },
  { key: "public", label: "Public page", Icon: BadgeCheck },
];

const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "?";
const initial = (name: string) => name.trim().charAt(0);
const Dot = ({ name }: { name: string }) => (
  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-200 text-sm font-bold text-brand-900" aria-hidden="true">{initial(name)}</span>
);
const money = (n: number) => `$${n.toFixed(2)}`;

export function TeamDemo() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("team");
  const [viewAs, setViewAs] = useState<string>("sophea");
  const me = people.find((p) => p.id === viewAs) as Person;
  const owner = me.role === "owner";

  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [day, setDay] = useState(TODAY);
  const [form, setForm] = useState({ person: "dara", start: "07:00", end: "12:00" });
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState({ title: "", person: "dara" });
  const [rates, setRates] = useState<Record<string, number>>(Object.fromEntries(people.map((p) => [p.id, p.rate])));
  const [paid, setPaid] = useState<Record<string, boolean>>({});
  const [showWorksAt, setShowWorksAt] = useState<Record<string, boolean>>({ dara: true, srey: true, vuthy: false });

  const clock = (id: string, to: Shift["clock"]) => setShifts((s) => s.map((x) => (x.id === id ? { ...x, clock: to } : x)));
  const cycle = (id: string) => setTasks((all) => all.map((x) => (x.id === id ? { ...x, status: (x.status === "todo" ? "doing" : x.status === "doing" ? "done" : "todo") as TaskStatus } : x)));
  const dayShifts = shifts.filter((s) => s.day === day && (owner || s.person === me.id)).sort((a, b) => a.start.localeCompare(b.start));
  const myTasks = tasks.filter((x) => owner || x.person === me.id);
  const staff = people.filter((p) => p.role === "member");
  const worked = (id: string) => shifts.filter((s) => s.person === id && s.clock === "out").reduce((n, s) => n + hoursOf(s), 0);
  const planned = (id: string) => shifts.filter((s) => s.person === id).reduce((n, s) => n + hoursOf(s), 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold leading-tight">Sophea Café</h1>
          <p className="text-sm text-ink-muted">{t("Phnom Penh")} · {t("{n} in team", { n: people.length })}</p>
        </div>
        <label className="text-xs text-ink-muted">
          {t("View as")}
          <select value={viewAs} onChange={(e) => setViewAs(e.target.value)} className="ml-1 rounded-full border border-stone-300 bg-white px-2 py-1 text-xs text-ink">
            <option value="sophea">{t("Owner")}: Sophea</option>
            <option value="dara">{t("Member")}: Dara</option>
          </select>
        </label>
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${tab === key ? "border-ink bg-ink text-white" : "border-stone-300 bg-white"}`}>
            <Icon className="size-3.5" />{t(label)}
          </button>
        ))}
      </div>

      <div className="mt-3"><Notice tone="info">{t("Demo with sample data. These features are not built yet. Nothing here is saved.")}</Notice></div>

      {tab === "team" && (
        <div className="mt-3 space-y-3">
          <ul className="card divide-y divide-stone-100">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <Dot name={p.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}{p.id === me.id ? ` (${t("You")})` : ""}</span>
                  <span className="text-xs text-ink-muted">{t(p.title)} · {t("since {when}", { when: p.since })}</span>
                </span>
                <Pill tone={p.role === "owner" ? "amber" : "neutral"}>{t(p.role === "owner" ? "Owner" : "Member")}</Pill>
              </li>
            ))}
          </ul>
          <p className="text-sm font-semibold text-ink-muted">{t("What the team can do next")}</p>
          <ul className="grid grid-cols-2 gap-2">
            {([["schedule", "Schedule", "Shifts and who came"], ["tasks", "Tasks", "Who does what"], ["pay", "Pay", "Hours and what is owed"], ["public", "Public page", "Company page, works at"]] as [Tab, string, string][]).map(([k, label, hint]) => (
              <li key={k}>
                <button type="button" onClick={() => setTab(k)} className="card h-full w-full p-3 text-left hover:bg-brand-50">
                  <span className="block font-semibold">{t(label)}</span>
                  <span className="block text-xs text-ink-muted">{t(hint)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "schedule" && (
        <div className="mt-3">
          <div className="flex gap-1 overflow-x-auto">
            {DAYS.map((d, i) => (
              <button key={d} type="button" onClick={() => setDay(i)} aria-pressed={day === i} className={`shrink-0 rounded-xl px-3 py-2 text-center text-xs font-medium ${day === i ? "bg-ink text-white" : "card"}`}>
                {t(d)}
                <span className="block text-[10px] opacity-70">{i === TODAY ? t("Today") : shifts.filter((s) => s.day === i && (owner || s.person === me.id)).length}</span>
              </button>
            ))}
          </div>
          {dayShifts.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">{t("No shifts this day.")}</p>
          ) : (
            <ul className="card mt-3 divide-y divide-stone-100">
              {dayShifts.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Dot name={nameOf(s.person)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{nameOf(s.person)}</span>
                    <span className="text-xs text-ink-muted">{s.start}–{s.end} · {hoursOf(s)} h</span>
                  </span>
                  {s.clock === "out" && <Pill tone="green">{t("Done")}</Pill>}
                  {s.clock === "absent" && <Pill tone="red">{t("Absent")}</Pill>}
                  {s.clock === "in" && <Button type="button" className="px-3 py-1.5 text-xs" onClick={() => clock(s.id, "out")}>{t("Clock out")}</Button>}
                  {s.clock === "none" && day === TODAY && (
                    <span className="flex gap-1">
                      <Button type="button" className="px-3 py-1.5 text-xs" onClick={() => clock(s.id, "in")}>{t("Clock in")}</Button>
                      {owner && <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => clock(s.id, "absent")}>{t("Absent")}</Button>}
                    </span>
                  )}
                  {s.clock === "none" && day !== TODAY && <Pill>{t("Planned")}</Pill>}
                </li>
              ))}
            </ul>
          )}
          {owner ? (
            <form
              className="card mt-3 flex flex-wrap items-end gap-2 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                setShifts((s) => [...s, { id: `n${s.length}`, day, start: form.start, end: form.end, person: form.person, clock: "none" }]);
              }}
            >
              <label className="text-xs text-ink-muted">{t("Person")}
                <select value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} className={`${inputClass} mt-1 py-1.5 text-sm`}>
                  {staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="text-xs text-ink-muted">{t("Start")}<input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className={`${inputClass} mt-1 py-1.5 text-sm`} /></label>
              <label className="text-xs text-ink-muted">{t("End")}<input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className={`${inputClass} mt-1 py-1.5 text-sm`} /></label>
              <Button type="submit" className="px-4 py-2 text-sm">{t("Add shift")}</Button>
            </form>
          ) : (
            <p className="mt-3 text-xs text-ink-muted">{t("You see your own shifts. The owner plans the week.")}</p>
          )}
        </div>
      )}

      {tab === "tasks" && (
        <div className="mt-3">
          <ul className="card divide-y divide-stone-100">
            {myTasks.map((x) => (
              <li key={x.id} className="flex items-center gap-3 px-4 py-2.5">
                <button type="button" onClick={() => cycle(x.id)} aria-label={t("Change status")} className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs ${x.status === "done" ? "border-emerald-600 bg-emerald-100 text-emerald-800" : x.status === "doing" ? "border-brand-500 bg-brand-100" : "border-stone-300 bg-white"}`}>
                  {x.status === "done" ? "✓" : x.status === "doing" ? "…" : ""}
                </button>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium ${x.status === "done" ? "text-ink-muted line-through" : ""}`}>{x.title}</span>
                  <span className="text-xs text-ink-muted">{nameOf(x.person)} · {t(x.due)}</span>
                </span>
                <Pill tone={x.status === "done" ? "green" : x.status === "doing" ? "amber" : "neutral"}>{t(x.status === "todo" ? "To do" : x.status === "doing" ? "Doing" : "Done")}</Pill>
              </li>
            ))}
          </ul>
          {owner && (
            <form
              className="card mt-3 flex flex-wrap items-end gap-2 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTask.title.trim()) return;
                setTasks((all) => [...all, { id: `t${all.length + 1}`, title: newTask.title.trim(), person: newTask.person, status: "todo", due: "Today" }]);
                setNewTask({ ...newTask, title: "" });
              }}
            >
              <input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder={t("New task")} className={`${inputClass} min-w-0 flex-1 py-1.5 text-sm`} />
              <select value={newTask.person} onChange={(e) => setNewTask({ ...newTask, person: e.target.value })} className={`${inputClass} w-auto py-1.5 text-sm`}>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button type="submit" className="px-4 py-2 text-sm">{t("Add task")}</Button>
            </form>
          )}
        </div>
      )}

      {tab === "pay" && (
        <div className="mt-3 space-y-3">
          <Notice tone="info">{t("Piron Work does not move money. It records the hours, the rate and what you paid, so both sides see the same numbers.")}</Notice>
          <ul className="card divide-y divide-stone-100">
            {staff.filter((p) => owner || p.id === me.id).map((p) => {
              const hours = worked(p.id);
              const amount = hours * (rates[p.id] ?? 0);
              return (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Dot name={p.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-ink-muted">{t("{h} h worked of {p} h planned", { h: hours, p: planned(p.id) })}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-bold">{money(amount)}</span>
                      <Pill tone={paid[p.id] ? "green" : "amber"}>{t(paid[p.id] ? "Paid" : "Owed")}</Pill>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span>{t("Rate per hour")}</span>
                    {owner ? (
                      <input type="number" step="0.1" min="0" value={rates[p.id]} onChange={(e) => setRates({ ...rates, [p.id]: Number(e.target.value) })} className={`${inputClass} w-20 py-1 text-sm`} />
                    ) : (
                      <span className="font-medium text-ink">{money(rates[p.id])}</span>
                    )}
                    {owner && amount > 0 && (
                      <Button type="button" variant={paid[p.id] ? "secondary" : "primary"} className="ml-auto px-3 py-1.5 text-xs" onClick={() => setPaid({ ...paid, [p.id]: !paid[p.id] })}>
                        {t(paid[p.id] ? "Undo" : "Mark as paid")}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {owner && <p className="text-sm font-semibold">{t("Total owed this week")}: {money(staff.reduce((n, p) => n + (paid[p.id] ? 0 : worked(p.id) * (rates[p.id] ?? 0)), 0))}</p>}
          <p className="text-xs text-ink-muted">{t("Wages, social security and tax rules need a legal review before this opens.")}</p>
        </div>
      )}

      {tab === "public" && (
        <div className="mt-3 space-y-3">
          <p className="text-sm font-semibold text-ink-muted">{t("What other people see: the company page")}</p>
          <section className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">Sophea Café</h2>
                <p className="text-sm text-ink-muted">{t("Café")} · {t("Phnom Penh")}</p>
              </div>
              <Pill tone="green">{t("Identity checked")}</Pill>
            </div>
            <p className="mt-2 text-sm">{t("{n} people on the team, 2 jobs open, 14 jobs completed.", { n: people.length })}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {people.filter((p) => p.role === "owner" || showWorksAt[p.id]).map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3 text-sm"><Dot name={p.name} />{p.name} · {t(p.title)}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-muted">{t("Only people who allow it are listed.")}</p>
          </section>
          <p className="text-sm font-semibold text-ink-muted">{t("What other people see: a member's profile")}</p>
          <section className="card p-4">
            <div className="flex items-center gap-3">
              <Dot name={me.role === "owner" ? "Dara" : me.name} />
              <div>
                <p className="font-bold">{me.role === "owner" ? "Dara" : me.name}</p>
                <p className="text-sm text-ink-muted">{t("Barista")} · {t("Phnom Penh")}</p>
              </div>
            </div>
            {showWorksAt[me.role === "owner" ? "dara" : me.id] ? (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{t("Works at {company} · {title} · since {when}", { company: "Sophea Café", title: t("Barista"), when: "Mar 2026" })}</p>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">{t("No works-at line is shown.")}</p>
            )}
          </section>
          {!owner && (
            <label className="card flex items-center gap-3 px-4 py-3 text-sm">
              <input type="checkbox" checked={!!showWorksAt[me.id]} onChange={(e) => setShowWorksAt({ ...showWorksAt, [me.id]: e.target.checked })} className="size-4 accent-brand-500" />
              {t("Show where I work on my profile")}
            </label>
          )}
        </div>
      )}
    </div>
  );
}
