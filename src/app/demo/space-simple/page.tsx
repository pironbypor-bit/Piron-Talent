import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Piron Work Space demo (simple)" };

// Simple demo of Piron Work Space, step 1. Three blocks only. All numbers are examples.

const NEEDS = [
  { label: "Identity checks", n: 2, href: "/admin/identity" },
  { label: "Reports", n: 1, href: "/admin/reports" },
  { label: "Payout accounts", n: 1, href: "/admin/payout-accounts" },
  { label: "Project requests", n: 1, href: "/admin" },
];

const NUMBERS = [
  { label: "People", n: "126", note: "4 new today" },
  { label: "Posts", n: "14", note: "3 new today" },
  { label: "Jobs done", n: "37", note: "1 today" },
  { label: "Problems", n: "0", note: "none now" },
];

const MORE = ["People", "Marketplace", "Errors", "Features", "Money", "Reports"];

export default function SpaceSimpleDemo() {
  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <p className="text-sm text-ink-muted">Piron Work Space · only you</p>
      <h1 className="text-2xl font-bold">Good morning</h1>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-green-50 p-4 text-green-900">
        <CheckCircle2 className="size-6 shrink-0 text-green-600" />
        <div>
          <p className="font-semibold">Everything is working</p>
          <p className="text-sm">Checked 2 minutes ago</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-800">Needs you</h2>
        <ul className="mt-2 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {NEEDS.map((x) => (
            <li key={x.label}>
              <Link href={x.href} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
                <span className="flex-1 font-medium">{x.label}</span>
                <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-sm font-bold">{x.n}</span>
                <ChevronRight className="size-4 text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-800">Numbers</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {NUMBERS.map((x) => (
            <div key={x.label} className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-xs text-ink-muted">{x.label}</p>
              <p className="text-3xl font-bold">{x.n}</p>
              <p className="text-xs text-ink-muted">{x.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-800">More</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {MORE.map((m) => (
            <span key={m} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-muted">{m}</span>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-muted">These open in the next steps.</p>
      </section>
    </main>
  );
}
