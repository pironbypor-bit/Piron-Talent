import Link from "next/link";
import { Button, Notice, Stepper, inputClass } from "@/components/ui";
import { cancelJob, confirmCompletion, leaveReview, markDelivered, openDispute } from "@/lib/app/actions";
import type { DisputeRow, MeRow, PostRow, ProjectJobRow, QuoteRow } from "@/lib/app/types";
import { formatDate } from "@/lib/dates";
import type { Locale, T } from "@/lib/i18n/core";
import { AvatarImg } from "../avatar";

type Props = { job: ProjectJobRow; post: PostRow; quotes: QuoteRow[]; reviewed: boolean; dispute: DisputeRow | null; providerSkills: string[]; me: MeRow | null; t: T; locale: Locale };

/** The job record after a quote is accepted: stepper, the next action for whoever is looking, review at the end. */
export function JobPanel({ job, post, quotes, reviewed, dispute, providerSkills, me, t, locale }: Props) {
  const isCustomer = !!me && me.id === job.customer_id;
  const isProvider = !!me && me.id === job.provider_id;
  const provider = quotes.find((q) => q.id === job.quote_id)?.provider ?? post.author;
  const current = job.status === "accepted" ? 0 : job.status === "delivered" ? 1 : job.status === "confirmed" ? (reviewed ? 3 : 2) : 0;

  return (
    <section className="card p-4">
      <h2 className="font-semibold">{t("Job")}</h2>
      <div className="mt-3 flex items-center gap-3">
        <AvatarImg name={provider.display_name} url={provider.avatar_url} />
        <div className="min-w-0 flex-1">
          <Link href={`/app/providers/${provider.id}`} className="font-semibold hover:underline">
            {provider.display_name}
          </Link>
          <p className="text-xs text-ink-muted">{formatDate(job.created_at, locale)}</p>
        </div>
        <p className="text-lg font-bold">${job.agreed_price}</p>
      </div>

      {job.status === "cancelled" ? (
        <div className="mt-4">
          <Notice tone="error">
            {t("This job was cancelled.")}
            {job.note ? ` ${job.note}` : ""}
          </Notice>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <Stepper steps={[t("Quote accepted"), t("Work delivered"), t("Customer confirmed"), t("Review left")]} current={current} />
          </div>
          <p className="mt-3 text-xs text-ink-muted">{t("You pay the provider directly, as agreed.")}</p>

          {job.status === "accepted" && (
            <div className="mt-4 space-y-3">
              {isProvider && (
                <form action={markDelivered.bind(null, post.id, job.id)}>
                  <Button type="submit">{t("Mark as delivered")}</Button>
                </form>
              )}
              {isCustomer && <p className="text-sm">{t("Waiting for the provider to deliver.")}</p>}
              {(isCustomer || isProvider) && (
                <form action={cancelJob.bind(null, post.id, job.id)} className="flex gap-2">
                  <input name="note" placeholder={t("Reason")} className={`${inputClass} py-1.5 text-sm`} />
                  <Button type="submit" variant="secondary" className="shrink-0 px-3 py-1.5 text-sm">{t("Cancel job")}</Button>
                </form>
              )}
            </div>
          )}

          {job.status === "delivered" && (
            <div className="mt-4 space-y-3">
              {isCustomer ? (
                <>
                  <Notice tone="info">{t("Delivered. Please check the work and confirm.")}</Notice>
                  <form action={confirmCompletion.bind(null, post.id, job.id)}>
                    <Button type="submit">{t("Confirm completion")}</Button>
                  </form>
                </>
              ) : (
                <p className="text-sm">{t("Waiting for the customer to confirm.")}</p>
              )}
            </div>
          )}

          {job.status === "confirmed" && (
            <div className="mt-4 space-y-3">
              <Notice tone="success">{t("This job is complete.")}</Notice>
              {isCustomer && !reviewed && (
                <form action={leaveReview.bind(null, post.id, job.id)} className="space-y-2">
                  <p className="font-semibold">{t("Rate the work")}</p>
                  <div className="flex gap-1" role="radiogroup" aria-label={t("Rating")}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="cursor-pointer text-2xl text-stone-300 has-[:checked]:text-brand-600">
                        <input type="radio" name="stars" value={n} defaultChecked={n === 5} className="sr-only" />★
                      </label>
                    ))}
                  </div>
                  <textarea name="comment" rows={3} className={inputClass} placeholder={t("Your review")} />
                  {providerSkills.length > 0 && (
                    <fieldset>
                      <legend className="text-sm font-medium">{t("Which skills stood out? Up to three.")}</legend>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {providerSkills.map((s) => (
                          <label key={s} className="cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-1 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-100">
                            <input type="checkbox" name="skills" value={s} className="sr-only" />{s}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <Button type="submit" className="px-4 py-2 text-sm">{t("Send review")}</Button>
                </form>
              )}
              {isCustomer && reviewed && <p className="text-sm text-ink-muted">{t("Review sent. Thank you.")}</p>}
            </div>
          )}

          {(isCustomer || isProvider) && (
            <div className="mt-4">
              {dispute && (dispute.status === "open" || dispute.status === "reviewing") ? (
                <Notice tone="info">
                  {dispute.opened_by === me?.id ? t("You opened a dispute. We will contact both sides.") : t("The other side opened a dispute. We will contact both sides.")}
                </Notice>
              ) : dispute && dispute.resolution ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm">
                  <p className="font-semibold">{dispute.status === "resolved" ? t("Dispute resolved") : t("Dispute dismissed")}</p>
                  <p className="mt-1">{dispute.resolution}</p>
                </div>
              ) : (
                <details className="text-sm">
                  <summary className="cursor-pointer text-ink-muted hover:text-ink">{t("Problem with this job? Open a dispute")}</summary>
                  <form action={openDispute.bind(null, post.id, job.id)} className="mt-2 space-y-2">
                    <textarea name="reason" rows={3} required minLength={3} maxLength={2000} className={inputClass} placeholder={t("What happened?")} />
                    <Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">{t("Open a dispute")}</Button>
                  </form>
                </details>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
