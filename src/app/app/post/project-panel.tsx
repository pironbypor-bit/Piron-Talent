import Link from "next/link";
import { Button, Pill, inputClass } from "@/components/ui";
import { acceptQuote, declineQuote, inviteProviders, sendQuote, withdrawQuote } from "@/lib/app/actions";
import type { DisputeRow, InviteState, MeRow, PostRow, ProjectJobRow, ProjectScope, QuoteRow } from "@/lib/app/types";
import { formatDate } from "@/lib/dates";
import type { Locale, T } from "@/lib/i18n/core";
import { AvatarImg } from "../avatar";
import { JobPanel } from "./job-panel";

type Props = { post: PostRow; scope: ProjectScope; quotes: QuoteRow[]; job: ProjectJobRow | null; count: number; reviewed: boolean; dispute: DisputeRow | null; providerSkills: string[]; invite: InviteState | null; me: MeRow | null; t: T; locale: Locale };

export const QUOTE_TONE: Record<string, "amber" | "green" | "neutral" | "red"> = { pending: "amber", accepted: "green", declined: "neutral", withdrawn: "neutral" };
export const QUOTE_LABEL: Record<string, string> = { pending: "Pending", accepted: "Accepted", declined: "Declined", withdrawn: "Withdrawn" };

const days = (t: T, n: number | null) => (n === null ? null : n === 1 ? t("Delivery in 1 day") : t("Delivery in {n} days", { n }));

/** Scope, quotes and the job record under a Job offer post. Who sees what follows the database policies. */
export function ProjectPanel({ post, scope, quotes, job, count, reviewed, dispute, me, t, locale, providerSkills, invite }: Props) {
  const isAuthor = !!me && me.id === post.author.id;
  const myQuote = me ? quotes.find((q) => q.provider_id === me.id) : undefined;
  const path = `/app/post/${post.id}`;
  const money = (n: number | null) => (n === null ? null : `$${n}`);
  const budget = scope.budget_min !== null || scope.budget_max !== null ? [money(scope.budget_min), money(scope.budget_max)].filter(Boolean).join(" - ") : null;

  return (
    <div className="mt-4 space-y-4">
      {(scope.deliverables.length > 0 || scope.deadline || budget) && (
        <section className="card p-4">
          {post.invited && post.opens_at && new Date(post.opens_at) > new Date() && (
            <p className="mb-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">
              {t("Invited: {name}. Opens to other providers on {date}.", { name: post.invited.display_name, date: formatDate(post.opens_at, locale) })}
            </p>
          )}
          <h2 className="font-semibold">{t("Scope")}</h2>
          {scope.deliverables.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {scope.deliverables.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {budget && <span className="rounded-full bg-brand-100 px-2.5 py-1 font-semibold text-brand-900">{t("Budget")} {budget}</span>}
            {scope.deadline && <span className="rounded-full bg-stone-100 px-2.5 py-1">{t("Deadline@@project")} {formatDate(scope.deadline, locale)}</span>}
            <span className="rounded-full bg-stone-100 px-2.5 py-1">{scope.remote ? t("Remote") : t("On site")}</span>
          </div>
        </section>
      )}

      {invite?.invitedMe && !job && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">{t("You were invited to send a quote.")}</p>
      )}

      {isAuthor && invite && !job && (
        <section className="card p-4">
          <h2 className="font-semibold">{t("Invite providers")}</h2>
          {invite.invited.length > 0 && (
            <ul className="mt-2 divide-y divide-stone-100">
              {invite.invited.map((i) => (
                <li key={i.provider.id} className="flex items-center gap-3 py-2">
                  <AvatarImg name={i.provider.display_name} url={i.provider.avatar_url} />
                  <Link href={`/app/providers/${i.provider.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">{i.provider.display_name}</Link>
                  <Pill tone={i.quoted ? "green" : "neutral"}>{i.quoted ? t("Quote sent") : t("Waiting")}</Pill>
                </li>
              ))}
            </ul>
          )}
          {invite.candidates.length > 0 ? (
            <form action={inviteProviders.bind(null, post.id)} className="mt-3">
              <ul className="space-y-1">
                {invite.candidates.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-brand-50">
                      <input type="checkbox" name="providers" value={c.id} className="size-4 accent-brand-500" />
                      <AvatarImg name={c.display_name} url={c.avatar_url} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{c.display_name}</span>
                        <span className="block truncate text-xs text-ink-muted">{c.role_line ? `${c.role_line} · ` : ""}{t(c.source === "worked" ? "Worked with before" : c.source === "kept" ? "Kept" : "Same category")}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <Button type="submit" className="mt-3 px-4 py-2 text-sm">{t("Send invitations")}</Button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">{t("No one to suggest yet. Keep providers from Services and they appear here.")}</p>
          )}
          <Link href="/app/services" className="mt-2 inline-block text-sm font-medium underline">{t("Find more in Services")}</Link>
        </section>
      )}

      {job ? (
        <JobPanel job={job} post={post} quotes={quotes} reviewed={reviewed} dispute={dispute} providerSkills={providerSkills} me={me} t={t} locale={locale} />
      ) : (
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("Quotes")}</h2>
            <span className="text-sm text-ink-muted">{t("{n} quotes", { n: count })}</span>
          </div>
          {isAuthor && <p className="mt-1 text-xs text-ink-muted">{t("Quotes are private between you and each provider.")}</p>}

          {isAuthor && quotes.filter((q) => q.status === "pending").length > 0 && <QuoteCompare quotes={quotes.filter((q) => q.status === "pending")} postId={post.id} t={t} />}

          {isAuthor && quotes.some((q) => q.status === "pending" || q.status === "accepted") && (
            <Link href={`/app/messages/new-group?post=${post.id}`} className="mt-3 inline-block text-sm font-medium underline">{t("Start a group chat")}</Link>
          )}

          {isAuthor && quotes.length > 0 && (
            <ul className="mt-3 space-y-3">
              {quotes.map((q) => (
                <li key={q.id} className="rounded-xl border border-stone-200 p-3">
                  <div className="flex items-start gap-3">
                    <AvatarImg name={q.provider.display_name} url={q.provider.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/app/providers/${q.provider.id}`} className="font-semibold hover:underline">
                        {q.provider.display_name}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {q.provider.role_line ?? ""} · {formatDate(q.created_at, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${q.price}</p>
                      {q.days !== null && <p className="text-xs text-ink-muted">{days(t, q.days)}</p>}
                    </div>
                  </div>
                  {q.note && <p className="mt-2 text-sm">{q.note}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Pill tone={QUOTE_TONE[q.status]}>{t(QUOTE_LABEL[q.status])}</Pill>
                    {q.status === "pending" && (
                      <>
                        <form action={acceptQuote.bind(null, post.id, q.id)}>
                          <Button type="submit" className="px-3 py-1.5 text-sm">{t("Accept quote")}</Button>
                        </form>
                        <form action={declineQuote.bind(null, post.id, q.id)}>
                          <Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">{t("Decline")}</Button>
                        </form>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!isAuthor && me && myQuote && (
            <div className="mt-3 rounded-xl border border-stone-200 p-3">
              <p className="text-sm font-semibold">{t("Your quote")}</p>
              <p className="mt-1 text-lg font-bold">
                ${myQuote.price} {myQuote.days !== null && <span className="text-xs font-normal text-ink-muted">· {days(t, myQuote.days)}</span>}
              </p>
              {myQuote.note && <p className="mt-1 text-sm">{myQuote.note}</p>}
              <div className="mt-2 flex items-center gap-2">
                <Pill tone={QUOTE_TONE[myQuote.status]}>{t(QUOTE_LABEL[myQuote.status])}</Pill>
                {myQuote.status === "pending" && (
                  <form action={withdrawQuote.bind(null, post.id, myQuote.id)}>
                    <button type="submit" className="text-sm underline">{t("Withdraw")}</button>
                  </form>
                )}
              </div>
            </div>
          )}

          {!isAuthor && me && !myQuote && (
            me.is_available ? (
              <form action={sendQuote.bind(null, post.id)} className="mt-3 space-y-3">
                <p className="font-semibold">{t("Send your quote")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">
                    {t("Price (USD)")}
                    <input name="price" inputMode="decimal" required className={`${inputClass} mt-1`} />
                  </label>
                  <label className="block text-sm font-medium">
                    {t("Delivery days")}
                    <input name="days" inputMode="numeric" className={`${inputClass} mt-1`} />
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  {t("What is included")}
                  <textarea name="note" rows={3} className={`${inputClass} mt-1`} />
                </label>
                <Button type="submit">{t("Send a quote")}</Button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                {t('Only providers can send quotes. Turn on "I offer services" in your profile.')}{" "}
                <Link href="/app/profile/edit" className="underline">{t("Edit profile")}</Link>
              </p>
            )
          )}
          {!me && (
            <p className="mt-3 text-sm">
              <Link href={`/login?next=${encodeURIComponent(path)}`} className="font-medium underline">{t("Log in to continue")}</Link>
            </p>
          )}
        </section>
      )}
    </div>
  );
}

/** Side-by-side view of the pending quotes: one column per provider, Accept on each. Markers only when there is something to compare. */
function QuoteCompare({ quotes, postId, t }: { quotes: QuoteRow[]; postId: string; t: T }) {
  const lowest = quotes.length > 1 ? Math.min(...quotes.map((q) => q.price)) : null;
  const withDays = quotes.filter((q) => q.days !== null);
  const fastest = quotes.length > 1 && withDays.length > 1 ? Math.min(...withDays.map((q) => q.days as number)) : null;
  return (
    <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1">
      <p className="mb-2 text-xs font-medium text-ink-muted">{t("Compare")}</p>
      <div className="flex gap-2" style={{ minWidth: "max-content" }}>
        {quotes.map((q) => {
          const isLowest = lowest !== null && q.price === lowest;
          const isFastest = fastest !== null && q.days === fastest;
          return (
            <div key={q.id} className={`w-44 shrink-0 rounded-2xl border p-3 ${isLowest ? "border-brand-400 bg-brand-50" : "border-stone-200 bg-white"}`}>
              <div className="flex items-center gap-2">
                <AvatarImg name={q.provider.display_name} url={q.provider.avatar_url} />
                <Link href={`/app/providers/${q.provider.id}`} className="min-w-0 truncate text-sm font-semibold hover:underline">
                  {q.provider.display_name}
                </Link>
              </div>
              <p className="mt-2 text-2xl font-bold">${q.price}</p>
              <dl className="mt-1 space-y-0.5 text-xs text-ink-muted">
                <div className="flex justify-between gap-2"><dt>{t("Days")}</dt><dd className="font-medium text-ink">{q.days ?? "–"}</dd></div>
                <div className="flex justify-between gap-2"><dt>{t("Rating")}</dt><dd className="font-medium text-ink">{q.stats.rating !== null ? `${q.stats.rating.toFixed(1)} (${q.stats.reviews})` : t("New")}</dd></div>
                <div className="flex justify-between gap-2"><dt>{t("Completed jobs")}</dt><dd className="font-medium text-ink">{q.stats.completed_jobs}</dd></div>
                <div className="flex justify-between gap-2"><dt>{t("Identity")}</dt><dd className="font-medium text-ink">{q.provider.identity_checked ? t("Checked") : t("Not yet")}</dd></div>
              </dl>
              <div className="mt-2 flex min-h-5 flex-wrap gap-1">
                {isLowest && <span className="rounded-full bg-brand-200 px-2 py-0.5 text-[10px] font-semibold text-brand-900">{t("Lowest price")}</span>}
                {isFastest && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-ink">{t("Fastest")}</span>}
              </div>
              <form action={acceptQuote.bind(null, postId, q.id)} className="mt-2">
                <Button type="submit" className="w-full px-3 py-1.5 text-sm">{t("Accept quote")}</Button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
