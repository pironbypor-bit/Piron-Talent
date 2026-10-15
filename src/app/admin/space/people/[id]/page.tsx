import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice } from "@/components/ui";
import { agoText, getPerson } from "@/lib/app/space";
import { formatDate } from "@/lib/dates";
import { SpaceNav } from "../../space-nav";
import { setPaused } from "../actions";

export const metadata: Metadata = { title: "Person - Piron Work Space" };
export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm";
const uuid = /^[0-9a-f-]{36}$/i;

/** One person: what they have done and one switch to pause or resume the account. No email, phone or ID number. */
export default async function PersonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  if (!uuid.test(id)) notFound();
  const p = await getPerson(id);
  if (!p) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">Not allowed, or this person no longer exists.</Notice>
      </main>
    );
  }
  const facts: [string, string | number][] = [
    ["Joined", formatDate(p.created_at, "en")],
    ["Last signed in", agoText(p.last_sign_in_at)],
    ["Posts", p.posts],
    ["Quotes sent", p.quotes],
    ["Jobs as customer", p.jobs_as_customer],
    ["Jobs as provider", p.jobs_as_provider],
    ["Confirmed jobs", p.completed_jobs],
    ["Reviews", p.reviews > 0 ? `${p.reviews} · ${p.avg_stars} stars` : "None yet"],
    ["Reports against", p.reports_against],
    ["Reports filed", p.reports_filed],
    ["Companies", p.companies],
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-bold">Piron Work Space</h1>
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">Owner only</span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-[190px_minmax(0,1fr)]">
        <SpaceNav active="people" />
        <div className="space-y-4">
          <Link href="/admin/space/people" className="text-sm font-medium underline">Back to People</Link>
          {error && <Notice tone="error">That did not work. Admins and your own account cannot be paused.</Notice>}

          <section className={card}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{p.display_name}</h2>
              {p.identity_checked && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-900">Identity checked</span>}
              {p.is_available && <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-900">Provider</span>}
              {p.is_admin && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold">Admin</span>}
              {p.paused_at && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-900">Paused {agoText(p.paused_at)}</span>}
            </div>
            <p className="text-sm text-ink-muted">{[p.role_line, p.city, p.district].filter(Boolean).join(" · ") || "No details yet"}</p>
            {p.bio && <p className="mt-2 text-sm">{p.bio}</p>}
            <p className="mt-3 text-sm"><Link href={`/app/providers/${p.id}`} className="font-medium underline">Open their public profile</Link></p>
          </section>

          <section className={card}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-stone-100 pb-1">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {p.recent_posts.length > 0 && (
            <section className={card}>
              <h2 className="text-sm font-semibold">Latest posts</h2>
              <ul className="mt-2 divide-y divide-stone-100 text-sm">
                {p.recent_posts.map((x) => (
                  <li key={x.id}>
                    <Link href={`/app/post/${x.id}`} className="flex gap-3 py-2 hover:bg-brand-50">
                      <span className="w-24 shrink-0 text-xs text-ink-muted">{formatDate(x.created_at, "en")}</span>
                      <span className="min-w-0 flex-1 truncate">{x.title}</span>
                      <span className="text-xs text-ink-muted">{x.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!p.is_admin && (
            <section className={`${card} ${p.paused_at ? "border-red-200" : ""}`}>
              <h2 className="text-sm font-semibold">{p.paused_at ? "This account is paused" : "Pause this account"}</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {p.paused_at
                  ? "They can log in but cannot post, quote, message or change anything, and they are hidden from provider lists. Resuming brings them back; they must turn the provider switch on again themselves."
                  : "They can still log in, but cannot post, quote, message or change anything. Their provider card and public pages are hidden. Use this for scams and abuse. It is logged."}
              </p>
              <form action={setPaused} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="pause" value={p.paused_at ? "0" : "1"} />
                <input name="note" maxLength={120} placeholder="Reason (kept in the audit log)" className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm" />
                <button type="submit" className={`rounded-xl px-4 py-2 text-sm font-semibold ${p.paused_at ? "bg-brand-500 text-ink hover:bg-brand-400" : "bg-red-700 text-white hover:bg-red-800"}`}>
                  {p.paused_at ? "Resume account" : "Pause account"}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
