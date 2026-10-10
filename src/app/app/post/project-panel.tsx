import Link from "next/link";
import { Button, Pill, inputClass } from "@/components/ui";
import { acceptQuote, declineQuote, sendQuote, withdrawQuote } from "@/lib/app/actions";
import type { MeRow, PostRow, ProjectJobRow, ProjectScope, QuoteRow } from "@/lib/app/types";
import { formatDate } from "@/lib/dates";
import type { Locale, T } from "@/lib/i18n/core";
import { AvatarImg } from "../avatar";
import { JobPanel } from "./job-panel";

type Props = { post: PostRow; scope: ProjectScope; quotes: QuoteRow[]; job: ProjectJobRow | null; count: number; reviewed: boolean; me: MeRow | null; t: T; locale: Locale };

export const QUOTE_TONE: Record<string, "amber" | "green" | "neutral" | "red"> = { pending: "amber", accepted: "green", declined: "neutral", withdrawn: "neutral" };
export const QUOTE_LABEL: Record<string, string> = { pending: "Pending", accepted: "Accepted", declined: "Declined", withdrawn: "Withdrawn" };

const days = (t: T, n: number | null) => (n === null ? null : n === 1 ? t("Delivery in 1 day") : t("Delivery in {n} days", { n }));

/** Scope, quotes and the job record under a Job offer post. Who sees what follows the database policies. */
export function ProjectPanel({ post, scope, quotes, job, count, reviewed, me, t, locale }: Props) {
  const isAuthor = !!me && me.id === post.author.id;
  const myQuote = me ? quotes.find((q) => q.provider_id === me.id) : undefined;
  const path = `/app/post/${post.id}`;
  const money = (n: number | null) => (n === null ? null : `$${n}`);
  const budget = scope.budget_min !== null || scope.budget_max !== null ? [money(scope.budget_min), money(scope.budget_max)].filter(Boolean).join(" - ") : null;

  return (
    <div className="mt-4 space-y-4">
      {(scope.deliverables.length > 0 || scope.deadline || budget) && (
        <section className="card p-4">
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

      {job ? (
        <JobPanel job={job} post={post} quotes={quotes} reviewed={reviewed} me={me} t={t} locale={locale} />
      ) : (
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("Quotes")}</h2>
            <span className="text-sm text-ink-muted">{t("{n} quotes", { n: count })}</span>
          </div>
          {isAuthor && <p className="mt-1 text-xs text-ink-muted">{t("Quotes are private between you and each provider.")}</p>}

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
