import type { Metadata } from "next";
import { Download, Plus } from "lucide-react";
import { Notice } from "@/components/ui";
import { Dropdown } from "@/components/dropdown";
import { COST_TYPES, INCOME_TYPES, getMoney, monthLabel, recentMonths, type MoneyEntry } from "@/lib/app/space";
import { SpaceNav } from "../space-nav";
import { addMoneyEntry, deleteMoneyEntry, stopMoneyEntry } from "./actions";

export const metadata: Metadata = { title: "Money - Piron Work Space" };
export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";
const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
const small = "rounded-lg border border-stone-300 bg-white px-2 py-0.5 text-xs font-semibold hover:bg-brand-50";

function EntryList({ title, rows, month }: { title: string; rows: MoneyEntry[]; month: string }) {
  return (
    <div className={card}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-2 divide-y divide-stone-100 text-sm">
        {rows.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-3 py-2">
            <span className="min-w-0">
              <span className="font-medium">{e.type}</span>
              {e.repeats && <span className="ml-2 rounded-full bg-stone-100 px-1.5 text-[10px] font-semibold text-ink-muted">monthly</span>}
              {e.note && <span className="block truncate text-xs text-ink-muted">{e.note}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-semibold">{usd(e.amount)}</span>
              <form action={e.repeats ? stopMoneyEntry : deleteMoneyEntry}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="month" value={month} />
                <button className={small} title={e.repeats ? "Stop repeating from this month" : "Delete this entry"}>{e.repeats ? "Stop" : "Delete"}</button>
              </form>
            </span>
          </li>
        ))}
        {rows.length === 0 && <li className="py-3 text-ink-muted">Nothing recorded for this month.</li>}
      </ul>
    </div>
  );
}

/** Piron Work Space, step 6: the owner's own book. Revenue and costs by month, monthly repeats, CSV. */
export default async function MoneyPage({ searchParams }: { searchParams: Promise<{ month?: string; error?: string }> }) {
  const { month: raw, error } = await searchParams;
  const options = recentMonths(12);
  const month = raw && options.includes(raw) ? raw : options[0];
  const data = await getMoney(month);
  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">Not allowed.</Notice>
      </main>
    );
  }
  const income = data.entries.filter((e) => e.kind === "income");
  const cost = data.entries.filter((e) => e.kind === "cost");
  const revenue = income.reduce((n, e) => n + Number(e.amount), 0);
  const costs = cost.reduce((n, e) => n + Number(e.amount), 0);
  const profit = revenue - costs;
  const totals = data.months.reduce((t, m) => ({ rev: t.rev + Number(m.revenue), cost: t.cost + Number(m.costs) }), { rev: 0, cost: 0 });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <SpaceNav active="money" />
        <div className="space-y-4">
          {error && <Notice tone="error">That did not work. Check the amount and try again.</Notice>}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
            This is your own book: what comes in and what goes out for Piron Work. Piron Work does not touch users&rsquo; money. &ldquo;Paid between users&rdquo; only shows how much users paid each other.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <form method="get" action="/admin/space/money" className="w-56">
              <Dropdown small submitOnChange name="month" defaultValue={month} label="Month" options={options.map((m) => ({ value: m, label: monthLabel(m) }))} />
            </form>
            <a href="/admin/space/money/export" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-brand-50"><Download className="size-4" />Download CSV (12 months)</a>
          </div>

          <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className={card}><p className="text-xs text-ink-muted">Revenue</p><p className="text-2xl font-bold text-green-800">{usd(revenue)}</p></div>
            <div className={card}><p className="text-xs text-ink-muted">Costs</p><p className="text-2xl font-bold">{usd(costs)}</p></div>
            <div className={card}><p className="text-xs text-ink-muted">Profit</p><p className={`text-2xl font-bold ${profit < 0 ? "text-red-700" : ""}`}>{usd(profit)}</p></div>
            <div className={card}><p className="text-xs text-ink-muted">Paid between users</p><p className="text-2xl font-bold">{usd(Number(data.volume))}</p><p className="text-xs text-ink-muted">market size, not your income</p></div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <EntryList title="Revenue entries" rows={income} month={month} />
            <EntryList title="Cost entries" rows={cost} month={month} />
          </section>

          <section className={card}>
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Plus className="size-4" />Add an entry to {monthLabel(month)}</h2>
            <form action={addMoneyEntry} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="month" value={month} />
              <div>
                <p className="mb-1 text-xs font-semibold text-ink-muted">Revenue type (used by Add as revenue)</p>
                <Dropdown small name="type_income" defaultValue={INCOME_TYPES[0]} label="Revenue type" options={INCOME_TYPES.map((x) => ({ value: x, label: x }))} />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-ink-muted">Cost type (used by Add as cost)</p>
                <Dropdown small name="type_cost" defaultValue={COST_TYPES[0]} label="Cost type" options={COST_TYPES.map((x) => ({ value: x, label: x }))} />
              </div>
              <label className="block text-xs font-semibold text-ink-muted">Amount (US dollars)
                <input name="amount" required inputMode="decimal" placeholder="0.00" className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-normal text-ink" />
              </label>
              <label className="block text-xs font-semibold text-ink-muted">Note (optional)
                <input name="note" maxLength={120} className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-normal text-ink" />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="repeats" /> Repeats every month from {monthLabel(month)}
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button type="submit" name="kind" value="income" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-400">Add as revenue</button>
                <button type="submit" name="kind" value="cost" className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-brand-50">Add as cost</button>
              </div>
            </form>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold">Last 6 months</h2>
            <table className="mt-2 w-full text-sm">
              <thead><tr className="text-left text-xs text-ink-muted"><th className="py-1 font-medium">Month</th><th className="py-1 text-right font-medium">Revenue</th><th className="py-1 text-right font-medium">Costs</th><th className="py-1 text-right font-medium">Profit</th><th className="hidden py-1 text-right font-medium sm:table-cell">Paid between users</th></tr></thead>
              <tbody>
                {data.months.map((r) => {
                  const p = Number(r.revenue) - Number(r.costs);
                  return (
                    <tr key={r.month} className="border-t border-stone-100">
                      <td className="py-1.5">{monthLabel(r.month)}</td>
                      <td className="py-1.5 text-right">{usd(Number(r.revenue))}</td>
                      <td className="py-1.5 text-right">{usd(Number(r.costs))}</td>
                      <td className={`py-1.5 text-right font-semibold ${p < 0 ? "text-red-700" : ""}`}>{usd(p)}</td>
                      <td className="hidden py-1.5 text-right text-ink-muted sm:table-cell">{usd(Number(r.volume))}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-stone-300">
                  <td className="py-1.5 font-semibold">Total</td>
                  <td className="py-1.5 text-right font-semibold">{usd(totals.rev)}</td>
                  <td className="py-1.5 text-right font-semibold">{usd(totals.cost)}</td>
                  <td className={`py-1.5 text-right font-bold ${totals.rev - totals.cost < 0 ? "text-red-700" : ""}`}>{usd(totals.rev - totals.cost)}</td>
                  <td className="hidden sm:table-cell" />
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </main>
  );
}
