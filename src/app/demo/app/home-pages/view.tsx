"use client";

import { useState } from "react";
import { CalendarClock, ClipboardList, X } from "lucide-react";
import { Dropdown } from "@/components/dropdown";
import { POSTS, ROWS, type Row } from "./data";
import { Professionals, START_CARD } from "./professionals";

// Demo of Home split into three pages. Sample data only; reload resets everything.

type Tab = "posts" | "pros" | "book";
const TONE: Record<Row["status"], string> = { Waiting: "bg-amber-100 text-amber-900", Active: "bg-blue-100 text-blue-900", Done: "bg-green-100 text-green-900", Cancelled: "bg-stone-200 text-ink-muted" };
const KIND_TONE: Record<string, string> = { "Job offer": "bg-brand-100 text-brand-900", "Skill offer": "bg-green-100 text-green-900", "Share knowledge": "bg-stone-100 text-ink" };

function BookSheet({ target, onClose, onSend }: { target: { name: string; price: number }; onClose: () => void; onSend: (when: string, what: string) => void }) {
  const [date, setDate] = useState("2026-10-24");
  const [time, setTime] = useState("09:00");
  const [what, setWhat] = useState("");
  const field = "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base";
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div role="dialog" aria-modal="true" aria-label="Book" className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-stone-300" />
        <div className="mt-3 flex items-start justify-between">
          <div><h2 className="text-lg font-bold">Book {target.name}</h2><p className="text-sm text-ink-muted">From ${target.price}. The provider can accept or suggest another price or time.</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-stone-100"><X className="size-5" /></button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-semibold">
          <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} /></label>
          <label>Time<input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} /></label>
        </div>
        <label className="mt-3 block text-sm font-semibold">What do you need?
          <textarea rows={3} value={what} onChange={(e) => setWhat(e.target.value)} placeholder="For example: clean 2 air conditioners at my shop" className={field} />
        </label>
        <p className="mt-2 text-xs text-ink-muted">You pay the provider directly, as agreed. Piron Work does not take or hold money.</p>
        <button type="button" disabled={what.trim().length < 3} onClick={() => onSend(`${date} ${time}`, what.trim())} className="mt-3 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50">Send booking request</button>
      </div>
    </div>
  );
}

function Bookings({ rows, setRows, goPros }: { rows: Row[]; setRows: (r: Row[]) => void; goPros: () => void }) {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const shown = rows.filter((r) => (type === "all" || r.type === type) && (status === "all" || r.status === status));
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-ink bg-ink text-white" : "border-stone-300 bg-white"}`;
  const act = (r: Row) => {
    if (r.status !== "Waiting" && r.status !== "Active") return null;
    const label = r.role === "provider" && r.type === "booking" ? "Accept" : r.type === "application" ? "Withdraw" : r.status === "Waiting" ? "Cancel" : null;
    return label ? <button type="button" onClick={() => setRows(rows.map((x) => (x.id === r.id ? { ...x, status: label === "Accept" ? "Active" : "Cancelled", label: label === "Accept" ? "You accepted" : label === "Withdraw" ? "You withdrew" : "You cancelled" } : x)))} className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold">{label}</button> : null;
  };
  return (
    <div>
      <h2 className="text-sm font-bold">My bookings and applications</h2>
      <p className="text-xs text-ink-muted">What you booked, what people asked you, and the jobs you applied for.</p>
      <div className="mt-2 w-1/2 min-w-40"><Dropdown compact label="Type" value={type} onChange={setType} options={[{ value: "all", label: "All" }, { value: "booking", label: "Bookings" }, { value: "application", label: "Applications" }, { value: "quote", label: "Quotes" }]} /></div>
      <div className="mt-2 flex flex-wrap gap-2">
        {["all", "Waiting", "Active", "Done", "Cancelled"].map((s) => <button key={s} type="button" className={chip(status === s)} onClick={() => setStatus(s)}>{s === "all" ? "Any status" : s}</button>)}
      </div>
      {shown.length === 0 ? (
        <div className="mt-8 text-center">
          <ClipboardList className="mx-auto size-10 text-ink-muted" />
          <p className="mt-2 text-sm text-ink-muted">No bookings or applications yet.<br />Try booking a professional or applying for a short shift.</p>
          <button type="button" onClick={goPros} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Explore professionals</button>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {shown.map((r) => (
            <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{r.type === "booking" ? (r.role === "provider" ? "Booking request for you" : "Booking") : r.type === "application" ? "Job application" : "Quote"}</p>
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="truncate text-xs text-ink-muted">{r.who}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted"><CalendarClock className="size-3" />{r.when}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[r.status]}`}>{r.status}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-ink-muted">{r.label}</span>
                <span className="flex gap-2">{act(r)}<button type="button" className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold">Open</button></span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function HomePagesDemo() {
  const [tab, setTab] = useState<Tab>("pros");
  const [rows, setRows] = useState<Row[]>(ROWS);
  const [target, setTarget] = useState<{ name: string; price: number } | null>(null);
  const [toast, setToast] = useState("");
  const waitingForMe = rows.filter((r) => r.role === "provider" && r.type === "booking" && r.status === "Waiting").length;

  const btn = (key: Tab, label: string, badge = 0) => (
    <button type="button" aria-current={tab === key ? "page" : undefined} onClick={() => setTab(key)} className={`relative flex-1 rounded-full px-3 py-2 text-sm font-semibold ${tab === key ? "bg-ink text-white" : "border border-stone-300 bg-white"}`}>
      {label}
      {badge > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-ink">{badge}</span>}
    </button>
  );

  function send(when: string, what: string) {
    if (!target) return;
    setRows([{ id: `n${Date.now()}`, type: "booking", role: "customer", title: what, who: target.name, when, status: "Waiting", label: "Waiting for the provider" }, ...rows]);
    setTarget(null);
    setToast("Booking request sent. You will see the answer here.");
    setTab("book");
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <main className="px-4 pb-24 pt-4">
      <p className="mb-3 rounded-xl bg-amber-100 px-3 py-2 text-xs text-amber-900"><b>Demo with sample data.</b> Try the buttons. Nothing is saved.</p>
      <div className="flex gap-2">
        {btn("posts", "Posts")}
        {btn("pros", "Professionals")}
        {btn("book", "My bookings", waitingForMe)}
      </div>
      {toast && <p className="mt-3 rounded-xl bg-green-100 px-3 py-2 text-sm text-green-900" role="status">{toast}</p>}
      <div className="mt-4">
        {tab === "posts" && (
          <div className="space-y-3">
            {POSTS.map((p) => (
              <article key={p.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2"><span className="text-xs text-ink-muted">{p.who} · {p.when}</span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${KIND_TONE[p.kind]}`}>{p.kind}</span></div>
                <h3 className="mt-1 font-bold">{p.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{p.body}</p>
                {p.budget && <p className="mt-2 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold">{p.budget}</p>}
              </article>
            ))}
          </div>
        )}
        {tab === "pros" && <Professionals mine={START_CARD} onBook={(name, price) => setTarget({ name, price })} />}
        {tab === "book" && <Bookings rows={rows} setRows={setRows} goPros={() => setTab("pros")} />}
      </div>
      {target && <BookSheet target={target} onClose={() => setTarget(null)} onSend={send} />}
    </main>
  );
}
