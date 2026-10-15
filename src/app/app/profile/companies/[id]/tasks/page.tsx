import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Field, Notice, Pill, inputClass } from "@/components/ui";
import { addTeamTask, deleteTeamTask, setTaskStatus } from "@/lib/app/actions";
import { getBusiness, getMe, teamTasks } from "@/lib/app/queries";
import { todayPP } from "@/lib/datetime";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TaskStatus } from "@/lib/app/types";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Tasks") };
}

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "doing", label: "Doing" },
  { key: "done", label: "Done" },
];
const small = "rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium hover:bg-brand-50";

/** Shared task list. Owner and managers create and assign; the person it is assigned to moves it along. */
export default async function TasksPage({ params, searchParams }: Props) {
  const [{ id }, { error }, t, locale, me] = await Promise.all([params, searchParams, getT(), getLocale(), getMe()]);
  const b = await getBusiness(id);
  if (!b || !me) notFound();
  const manager = b.role === "owner" || b.role === "manager";
  const tasks = await teamTasks(b.id);
  const today = todayPP();

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href={`/app/profile/companies/${b.id}`} className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <h1 className="text-xl font-bold">{t("Tasks")}</h1>
        <p className="text-sm text-ink-muted">{b.name} · {manager ? t("Everyone in the team") : t("Assigned to you")}</p>
      </section>
      {error && <div className="mt-3"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}

      {COLUMNS.map((col) => {
        const list = tasks.filter((x) => x.status === col.key);
        return (
          <section key={col.key} className="mt-4">
            <h2 className="px-1 text-sm font-semibold text-ink-muted">{t(col.label)} · {list.length}</h2>
            {list.length === 0 ? (
              <p className="card mt-2 p-3 text-sm text-ink-muted">{t("Nothing here.")}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {list.map((x) => {
                  const mine = x.assignee_id === me.id;
                  const late = x.due_on && x.status !== "done" && x.due_on < today;
                  const go = (s: TaskStatus) => setTaskStatus.bind(null, b.id, x.id, s);
                  return (
                    <li key={x.id} className="card p-3">
                      <p className="font-medium">{x.title}</p>
                      {x.detail && <p className="mt-0.5 text-sm text-ink-muted">{x.detail}</p>}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                        <span>{x.assignee ?? t("Nobody yet")}</span>
                        {x.due_on && <Pill tone={late ? "red" : "neutral"}>{t("Due {date}", { date: formatDate(x.due_on, locale) })}</Pill>}
                      </div>
                      {(mine || manager) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {x.status !== "todo" && <form action={go("todo")}><button type="submit" className={small}>{t("To do")}</button></form>}
                          {x.status !== "doing" && <form action={go("doing")}><button type="submit" className={small}>{t("Doing")}</button></form>}
                          {x.status !== "done" && <form action={go("done")}><button type="submit" className={`${small} border-emerald-300`}>{t("Done")}</button></form>}
                          {manager && <form action={deleteTeamTask.bind(null, b.id, x.id)} className="ml-auto"><button type="submit" className="text-xs underline">{t("Delete")}</button></form>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {manager && (
        <section className="card mt-4 p-4">
          <h2 className="font-semibold">{t("Add a task")}</h2>
          <form action={addTeamTask.bind(null, b.id)} className="mt-3 space-y-3">
            <Field label={t("Title")}><input name="title" required minLength={2} maxLength={120} className={inputClass} /></Field>
            <Field label={t("Details")} optional={t("optional")}><textarea name="detail" rows={2} maxLength={500} className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("Assign to")}>
                <select name="assignee" className={inputClass} defaultValue="">
                  <option value="">{t("Nobody yet")}</option>
                  {b.team.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
                </select>
              </Field>
              <Field label={t("Due")} optional={t("optional")}><input type="date" name="due" className={inputClass} /></Field>
            </div>
            <Button type="submit" className="px-4 py-2 text-sm">{t("Add task")}</Button>
          </form>
        </section>
      )}
    </main>
  );
}
