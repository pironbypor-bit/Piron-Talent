import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, inputClass, Notice, Pill } from "@/components/ui";
import { blockUser, inviteToProject, sendHello, startConversation, toggleKeepProvider, unblockUser } from "@/lib/app/actions";
import { ShareButton } from "@/components/share-button";
import { contactState, getMe, getProvider, iBlocked, isPayoutVerified, lastConfirmedJobWith, myOpenProjects, volunteerRecord } from "@/lib/app/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvailablePill, replyText } from "@/components/signals";
import { AvatarImg } from "../avatar";
import { ReportForm } from "../report-form";
import { Stars } from "@/app/demo/demo-ui";
import { Dropdown } from "@/components/dropdown";

/* eslint-disable @next/next/no-img-element */

/** One provider profile. `base` is "/app" inside the app and "" on the public site; everything else is the same. */
export async function ProviderProfile({ id, base, error, reported, invited }: { id: string; base: "/app" | ""; error?: string; reported?: string; invited?: string }) {
  const [t, locale, me, rehireFrom] = await Promise.all([getT(), getLocale(), getMe(), lastConfirmedJobWith(id)]);
  const contact = me && me.id !== id ? await contactState(id) : null;
  // "Invite to a project": only for people who are open to work or already talking with me.
  const projects = contact && (contact.state === "open" || contact.state === "conversation") ? await myOpenProjects() : [];
  const data = await getProvider(id);
  if (!data) notFound();
  const volunteer = await volunteerRecord(id);
  const blocked = me && me.id !== id ? await iBlocked(id) : false;
  const { provider: p, portfolio, reviews, record, endorsements, worksAt } = data;
  const payoutVerified = await isPayoutVerified(p.id);
  const supabase = await createClient();
  const image = (path: string) => supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
  const path = `${base}/providers/${p.id}`;
  const keep = toggleKeepProvider.bind(null, p.id, path);
  const connect = startConversation.bind(null, p.id);
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : null;

  return (
    <main className={base ? "px-4 pb-24 pt-4" : "mx-auto max-w-3xl px-4 py-10"}>
      <Link href={base ? "/app/services" : "/providers"} className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      <header className="mt-3 flex items-start gap-3">
        <AvatarImg name={p.display_name} url={p.avatar_url} size={14} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight">{p.display_name}</h1>
          <p className="text-ink-muted">
            {p.role_line ?? ""}
            {p.city ? ` · ${t(p.city)}${p.district ? ` · ${p.district}` : ""}` : ""}
            {p.remote ? ` · ${t("Remote")}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            {rating !== null && <Stars rating={rating} />}
            <span className="text-ink-muted">{t("{n} completed jobs", { n: p.completed_jobs })}</span>
            {p.identity_checked && <Pill tone="green">{t("Identity checked")}</Pill>}
            {payoutVerified && <Pill tone="green">{t("Payout account verified")}</Pill>}
            <AvailablePill s={p} t={t} />
            {replyText(t, p) && <span className="text-ink-muted">{replyText(t, p)}</span>}
          </div>
          {worksAt.length > 0 && (
            <p className="mt-1 text-sm">
              {t("Works at")}{" "}
              {worksAt.map((w, i) => (
                <span key={w.id}>
                  {i > 0 && ", "}
                  <Link href={`/companies/${w.id}`} className="font-medium underline">{w.name}</Link>
                  {w.job_title ? <span className="text-ink-muted"> ({w.job_title})</span> : null}
                </span>
              ))}
            </p>
          )}
        </div>
      </header>
      {invited === "1" && <div className="mt-3"><Notice tone="success">{t("Invitation sent. {name} will see it in notifications.", { name: p.display_name })}</Notice></div>}
      {invited === "0" && <div className="mt-3"><Notice tone="info">{t("{name} was already invited to that project.", { name: p.display_name })}</Notice></div>}
      {error === "limit" && <div className="mt-3"><Notice tone="error">{t("You sent several requests today. Try again tomorrow.")}</Notice></div>}
      {error && error !== "limit" && <div className="mt-3"><Notice tone="error">{t("Something went wrong: {error}", { error })}</Notice></div>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {p.price_from && <span className="rounded-full bg-brand-100 px-3 py-1.5 text-sm font-semibold text-brand-900">{t("From {price}", { price: p.price_from })}</span>}
        {rehireFrom && (
          <Link href={`/app/post/new?rehire=${rehireFrom}&to=${p.id}`} className="rounded-full bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-brand-400">
            {t("Hire again")}
          </Link>
        )}
        <ShareButton path={`/providers/${p.id}`} title={p.display_name} />
        <form action={keep}>
          <button type="submit" aria-pressed={p.saved} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${p.saved ? "border-brand-400 bg-brand-100" : "border-stone-300 bg-white hover:bg-stone-50"}`}>
            {p.saved ? t("Kept") : t("Keep")}
          </button>
        </form>
      </div>

      {p.bio && (
        <section className="mt-5">
          <h2 className="font-semibold">{t("About")}</h2>
          <p className="mt-1 whitespace-pre-wrap leading-relaxed">{p.bio}</p>
        </section>
      )}
      {p.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {p.skills.map((s) => {
            const n = endorsements.find((e) => e.skill === s)?.n ?? 0;
            return (
              <li key={s} className={`rounded-full border px-3 py-1 text-sm ${n ? "border-brand-300 bg-brand-50" : "border-stone-300 bg-white"}`}>
                {s}
                {n > 0 && <span className="ml-1 text-xs text-brand-900">· {t("endorsed {n}", { n })}</span>}
              </li>
            );
          })}
        </ul>
      )}

      {volunteer.activities > 0 && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {t("Volunteer record · Activities: {n} · Hours: {hours}", { n: volunteer.activities, hours: volunteer.hours })}
        </p>
      )}

      {record.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">{t("Work record")}</h2>
          <p className="text-xs text-ink-muted">{t("Jobs confirmed on Piron Work. Names appear only when both people allow it.")}</p>
          <ul className="card mt-2 divide-y divide-stone-100">
            {record.map((r) => (
              <li key={r.job_id} className="px-3 py-2.5">
                <p className="truncate font-medium">{r.title}</p>
                <p className="text-xs text-ink-muted">
                  {formatDate(r.completed_at, locale)} · {t(r.role === "provider" ? "As provider" : "As customer")} ·{" "}
                  {r.other_id && r.other_name ? <Link href={`${base}/providers/${r.other_id}`} className="underline">{r.other_name}</Link> : t(r.role === "provider" ? "a customer" : "a provider")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">{t("Portfolio")}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {portfolio.map((item) => (
              <li key={item.id} className="card overflow-hidden">
                <img src={image(item.image_path)} alt={item.caption ?? ""} className="aspect-[4/3] w-full object-cover" />
                {item.caption && <p className="px-2 py-1.5 text-xs">{item.caption}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-semibold">{t("Invite to a project")}</h2>
          <form action={inviteToProject.bind(null, p.id)} className="mt-2 flex flex-wrap gap-2">
            <input type="hidden" name="back" value={path} />
            <Dropdown name="post" className="min-w-0 flex-1" defaultValue={projects[0]?.id ?? ""} label={t("Choose a project")} options={projects.map((pj) => ({ value: pj.id, label: pj.title }))} />
            <Button type="submit" className="px-4 py-2 text-sm">{t("Send invitation")}</Button>
          </form>
        </section>
      )}
      {contact?.state === "conversation" && contact.conversationId && (
        <section className="mt-6 rounded-2xl border border-brand-300 bg-brand-50 p-4">
          <p className="text-sm">{t("You are already talking.")}</p>
          <Link href={`/app/messages/${contact.conversationId}`} className="mt-2 inline-block rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-ink hover:bg-brand-400">{t("Open conversation")}</Link>
        </section>
      )}
      {contact?.state === "can_request" && (
        <section className="mt-6 rounded-2xl border border-brand-300 bg-brand-50 p-4">
          <h2 className="font-semibold">{t("Say hello")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("This person has not opened messages. Send one short request. They can accept or say not now.")}</p>
          <form action={sendHello.bind(null, p.id)} className="mt-2 space-y-2">
            <input type="hidden" name="back" value={path} />
            <textarea name="body" rows={3} maxLength={300} className={inputClass} placeholder={t("Who you are and why you are writing.")} required />
            <Button type="submit" className="px-4 py-2 text-sm">{t("Send request")}</Button>
          </form>
        </section>
      )}
      {contact?.state === "pending" && <p className="mt-6 rounded-2xl bg-stone-100 p-4 text-sm">{t("Your request was sent. You will see the answer in your notifications.")}</p>}
      {contact?.state === "incoming" && (
        <p className="mt-6 rounded-2xl border border-brand-300 bg-brand-50 p-4 text-sm">
          {t("{name} sent you a request", { name: p.display_name })}{" "}
          <Link href="/app/messages" className="font-medium underline">{t("See requests")}</Link>
        </p>
      )}
      {contact?.state === "declined" && <p className="mt-6 rounded-2xl bg-stone-100 p-4 text-sm">{t("{name} is not taking messages right now.", { name: p.display_name })}</p>}
      {contact?.state === "open" && (
        <section className="mt-6 rounded-2xl border border-brand-300 bg-brand-50 p-4">
          <h2 className="font-semibold">{t("Request a quote")}</h2>
          <form action={connect} className="mt-2 space-y-2">
            <input type="hidden" name="back" value={path} />
            <textarea name="body" rows={3} className={inputClass} placeholder={t("Your message")} required />
            <Button type="submit" className="px-4 py-2 text-sm">
              {t("Send message")}
            </Button>
          </form>
        </section>
      )}
      {!me && (
        <p className="mt-6 text-sm">
          <Link href={`/login?next=${encodeURIComponent(path)}`} className="font-medium underline">
            {t("Log in to continue")}
          </Link>
        </p>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">{t("Reviews")}</h2>
        {reviews.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">{t("Reviews are written only after a completed job.")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="card p-3">
                <Stars rating={r.stars} />
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                <p className="mt-1 text-xs text-ink-muted">
                  {r.author.display_name} · {formatDate(r.created_at, locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      {me && me.id !== p.id && <ReportForm type="user" id={p.id} path={path} reported={reported === "1"} t={t} />}
      {me && me.id !== p.id && (
        <form action={(blocked ? unblockUser : blockUser).bind(null, p.id, path)} className="mt-3">
          <button type="submit" className="text-sm text-ink-muted underline">{blocked ? t("Unblock this person") : t("Block this person")}</button>
        </form>
      )}
    </main>
  );
}
