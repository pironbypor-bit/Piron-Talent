"use client";

import { useMemo, useState } from "react";
import { BarChart3, Bug, Download, FileText, Flag, LayoutDashboard, Plus, ScrollText, Users, Wallet } from "lucide-react";
import { Dropdown } from "@/components/dropdown";

// Sample data only. Amounts are US dollars. Nothing here reads or writes real records.

type Entry = { id: number; month: string; kind: "income" | "cost"; type: string; amount: number; note: string; repeats?: boolean };

const MONTHS = ["2026-10", "2026-09", "2026-08", "2026-07", "2026-06", "2026-05"];
const MONTH_LABEL: Record<string, string> = { "2026-10": "October 2026", "2026-09": "September 2026", "2026-08": "August 2026", "2026-07": "July 2026", "2026-06": "June 2026", "2026-05": "May 2026" };
const INCOME_TYPES = ["Service fee", "Subscription", "Paid listing", "Advertising", "Other income"];
const COST_TYPES = ["Cloudflare", "Supabase", "Email (Brevo)", "Domain names", "Phone and internet", "Legal and accounting", "Marketing", "Other cost"];

const SEED: Entry[] = [
  { id: 1, month: "2026-10", kind: "income", type: "Service fee", amount: 42, note: "5% on 3 confirmed jobs" },
  { id: 2, month: "2026-10", kind: "income", type: "Subscription", amount: 30, note: "6 provider plans at $5" },
  { id: 3, month: "2026-10", kind: "cost", type: "Cloudflare", amount: 5, note: "Workers plan", repeats: true },
  { id: 4, month: "2026-10", kind: "cost", type: "Supabase", amount: 25, note: "Pro plan", repeats: true },
  { id: 5, month: "2026-10", kind: "cost", type: "Email (Brevo)", amount: 0, note: "Free plan", repeats: true },
  { id: 6, month: "2026-10", kind: "cost", type: "Domain names", amount: 14, note: "piron.tech renewal" },
  { id: 7, month: "2026-09", kind: "income", type: "Service fee", amount: 18, note: "" },
  { id: 8, month: "2026-09", kind: "income", type: "Subscription", amount: 20, note: "" },
  { id: 9, month: "2026-09", kind: "cost", type: "Cloudflare", amount: 5, note: "", repeats: true },
  { id: 10, month: "2026-09", kind: "cost", type: "Supabase", amount: 25, note: "", repeats: true },
  { id: 11, month: "2026-08", kind: "income", type: "Service fee", amount: 6, note: "" },
  { id: 12, month: "2026-08", kind: "cost", type: "Cloudflare", amount: 5, note: "", repeats: true },
  { id: 13, month: "2026-08", kind: "cost", type: "Supabase", amount: 25, note: "", repeats: true },
  { id: 14, month: "2026-07", kind: "cost", type: "Cloudflare", amount: 5, note: "", repeats: true },
  { id: 15, month: "2026-07", kind: "cost", type: "Supabase", amount: 25, note: "", repeats: true },
];

// Market volume: invoices users marked as paid between themselves. Not your income.
const VOLUME: Record<string, number> = { "2026-10": 840, "2026-09": 360, "2026-08": 120, "2026-07": 0, "2026-06": 0, "2026-05": 0 };

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";
const NAV = [
  { label: "Overview", Icon: LayoutDashboard }, { label: "People", Icon: Users }, { label: "Marketplace", Icon: BarChart3 },
  { label: "Errors", Icon: Bug }, { label: "Features", Icon: Flag }, { label: "Money", Icon: Wallet, on: true },
  { label: "Reports", Icon: FileText }, { label: "Audit log", Icon: ScrollText },
];

export function MoneyDemo() {
  const [month, setMonth] = useState("2026-10");
  const [entries, setEntries] = useState<Entry[]>(SEED);
  const [kind, setKind] = useState<"income" | "cost">("income");
  const [type, setType] = useState(INCOME_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const sum = (rows: Entry[], k: Entry["kind"]) => rows.filter((e) => e.kind === k).reduce((n, e) => n + e.amount, 0);
  const rows = entries.filter((e) => e.month === month);
  const revenue = sum(rows, "income");
  const costs = sum(rows, "cost");
  const table = useMemo(() => MONTHS.map((m) => {
    const r = entries.filter((e) => e.month === m);
    return { m, inc: sum(r, "income"), cost: sum(r, "cost"), profit: sum(r, "income") - sum(r, "cost") };
  }), [entries]);
  const total = table.reduce((n, r) => n + r.profit, 0);
  const types = kind === "income" ? INCOME_TYPES : COST_TYPES;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(amount);
    if (amount === "" || !Number.isFinite(a) || a < 0) return;
    setEntries((list) => [...list, { id: Date.now(), month, kind, type, amount: a, note }]);
    setAmount("");
    setNote("");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Demo, sample numbers</span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Space sections">
          {NAV.map(({ label, Icon, on }) => (
            <span key={label} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${on ? "bg-brand-100 text-brand-900" : "text-ink-muted"}`}><Icon className="size-4" />{label}</span>
          ))}
        </nav>
        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
            This is your own book: what comes in and what goes out for Piron Work. Piron Work does not touch users&rsquo; money. The market volume number only shows how much users paid each other.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="w-56"><Dropdown small label="Month" value={month} onChange={setMonth} options={MONTHS.map((m) => ({ value: m, label: MONTH_LABEL[m] }))} /></div>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-brand-50"><Download className="size-4" />Download CSV (demo)</button>
          </div>

          <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className={card}><p className="text-xs text-ink-muted">Revenue</p><p className="text-2xl font-bold text-green-800">{usd(revenue)}</p></div>
            <div className={card}><p className="text-xs text-ink-muted">Costs</p><p className="text-2xl font-bold">{usd(costs)}</p></div>
            <div className={card}><p className="text-xs text-ink-muted">Profit</p><p className={`text-2xl font-bold ${revenue - costs < 0 ? "text-red-700" : ""}`}>{usd(revenue - costs)}</p></div>
            <div className={card}><p className="text-xs text-ink-muted">Paid between users</p><p className="text-2xl font-bold">{usd(VOLUME[month] ?? 0)}</p><p className="text-xs text-ink-muted">market size, not your income</p></div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {(["income", "cost"] as const).map((k) => (
              <div key={k} className={card}>
                <h2 className="text-sm font-semibold">{k === "income" ? "Revenue entries" : "Cost entries"}</h2>
                <ul className="mt-2 divide-y divide-stone-100 text-sm">
                  {rows.filter((e) => e.kind === k).map((e) => (
                    <li key={e.id} className="flex items-baseline justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="font-medium">{e.type}</span>
                        {e.repeats && <span className="ml-2 rounded-full bg-stone-100 px-1.5 text-[10px] font-semibold text-ink-muted">monthly</span>}
                        {e.note && <span className="block truncate text-xs text-ink-muted">{e.note}</span>}
                      </span>
                      <span className="shrink-0 font-semibold">{usd(e.amount)}</span>
                    </li>
                  ))}
                  {rows.filter((e) => e.kind === k).length === 0 && <li className="py-3 text-ink-muted">Nothing recorded for this month.</li>}
                </ul>
              </div>
            ))}
          </section>

          <section className={card}>
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Plus className="size-4" />Add an entry to {MONTH_LABEL[month]}</h2>
            <form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-semibold text-ink-muted">Kind</p>
                <Dropdown small label="Kind" value={kind} onChange={(v) => { const k = v as "income" | "cost"; setKind(k); setType((k === "income" ? INCOME_TYPES : COST_TYPES)[0]); }} options={[{ value: "income", label: "Revenue (money in)" }, { value: "cost", label: "Cost (money out)" }]} />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-ink-muted">Type</p>
                <Dropdown small label="Type" value={type} onChange={setType} options={types.map((x) => ({ value: x, label: x }))} />
              </div>
              <label className="block text-xs font-semibold text-ink-muted">Amount (US dollars)
                <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-normal text-ink" />
              </label>
              <label className="block text-xs font-semibold text-ink-muted">Note (optional)
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm font-normal text-ink" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-400">Add entry</button>
                <span className="ml-3 text-xs text-ink-muted">In the real version a cost can be marked as monthly, so it fills in every month.</span>
              </div>
            </form>
          </section>

          <section className={card}>
            <h2 className="text-sm font-semibold">Last 6 months</h2>
            <table className="mt-2 w-full text-sm">
              <thead><tr className="text-left text-xs text-ink-muted"><th className="py-1 font-medium">Month</th><th className="py-1 text-right font-medium">Revenue</th><th className="py-1 text-right font-medium">Costs</th><th className="py-1 text-right font-medium">Profit</th></tr></thead>
              <tbody>
                {table.map((r) => (
                  <tr key={r.m} className="border-t border-stone-100">
                    <td className="py-1.5">{MONTH_LABEL[r.m]}</td>
                    <td className="py-1.5 text-right">{usd(r.inc)}</td>
                    <td className="py-1.5 text-right">{usd(r.cost)}</td>
                    <td className={`py-1.5 text-right font-semibold ${r.profit < 0 ? "text-red-700" : ""}`}>{usd(r.profit)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-stone-300"><td className="py-1.5 font-semibold">Total</td><td /><td /><td className={`py-1.5 text-right font-bold ${total < 0 ? "text-red-700" : ""}`}>{usd(total)}</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </main>
  );
}
