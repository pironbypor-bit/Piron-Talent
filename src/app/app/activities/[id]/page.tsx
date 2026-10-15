import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, MessageCircle, Package, Users } from "lucide-react";
import { Button, CheckedPill, Notice, Pill, inputClass } from "@/components/ui";
import { cancelActivity, confirmVolunteer, joinActivity, leaveActivity } from "@/lib/app/actions";
import { ShareButton } from "@/components/share-button";
import { getActivity, getMe } from "@/lib/app/queries";
import { formatRange } from "@/lib/datetime";
import { getLocale, getT } from "@/lib/i18n/server";
import { shareMeta } from "@/lib/seo";
import { AvatarImg } from "../../avatar";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getActivity(id);
  if (!data) return { title: "Piron Work" };
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const x = data.activity;
  return shareMeta({ title: x.title, description: [formatRange(x.starts_at, x.ends_at, locale), x.place, x.city ? t(x.city) : null].filter(Boolean).join(" · "), path: `/app/activities/${id}`, generated: true, type: "article" });
}

/** One activity: details, Join or Leave, the group chat for people who are in, and the organiser's list. */
export default async function ActivityPage({ params }: Props) {
  const [{ id }, t, locale, me] = await Promise.all([params, getT(), getLocale(), getMe()]);
  const data = await getActivity(id);
  if (!data) notFound();
  const { activity: a, volunteers, isOrganiser } = data;
  const full = a.joined >= a.capacity;
  const started = new Date(a.starts_at) <= new Date();
  const ended = new Date(a.ends_at) <= new Date();
  const cancelled = a.status === "cancelled";
  const inChat = !!a.conversation_id && (isOrganiser || a.mine === "joined" || a.mine === "confirmed");
  const label = (s: string) => (s === "confirmed" ? "Present" : s === "absent" ? "Absent" : s === "waitlist" ? "Waitlist" : "Joined");

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/activities" className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <h1 className="text-xl font-bold">{a.title}</h1>
        <div className="mt-2"><ShareButton path={`/app/activities/${a.id}`} title={a.title} /></div>
        {cancelled && <p className="mt-2"><Pill tone="red">{t("Cancelled")}</Pill></p>}
        <ul className="mt-3 space-y-1.5 text-sm">
          <li className="flex items-center gap-2"><CalendarClock className="size-4 text-ink-muted" />{formatRange(a.starts_at, a.ends_at, locale)}</li>
          <li className="flex items-center gap-2"><MapPin className="size-4 text-ink-muted" />{[a.place, a.city ? t(a.city) : null].filter(Boolean).join(" · ") || "-"}</li>
          <li className="flex items-center gap-2"><Users className="size-4 text-ink-muted" />{t("{n} of {max} places taken", { n: a.joined, max: a.capacity })}{a.waitlist > 0 ? ` · ${t("{n} waiting", { n: a.waitlist })}` : ""}</li>
          {a.bring && <li className="flex items-center gap-2"><Package className="size-4 text-ink-muted" />{t("Bring")}: {a.bring}</li>}
        </ul>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed">{a.description}</p>
        <div className="mt-3 flex items-center gap-3 border-t border-stone-100 pt-3">
          <AvatarImg name={a.organiser.display_name} url={a.organiser.avatar_url} />
          <div className="min-w-0 flex-1">
            <Link href={`/app/providers/${a.organiser.id}`} className="block truncate font-semibold hover:underline">{a.organiser.display_name}</Link>
            <span className="text-xs text-ink-muted">{t("Organiser")}</span>
          </div>
          {a.organiser.identity_checked && <CheckedPill>{t("Identity checked")}</CheckedPill>}
        </div>
      </section>

      {!cancelled && !isOrganiser && !ended && (
        <section className="mt-3">
          {a.mine === "joined" || a.mine === "waitlist" ? (
            <div className="card flex items-center gap-3 p-3">
              <p className="flex-1 text-sm font-medium">{a.mine === "joined" ? t("You are in. See you there.") : t("You are on the waitlist. We will tell you if a place opens.")}</p>
              <form action={leaveActivity.bind(null, a.id)}><Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">{t("Leave")}</Button></form>
            </div>
          ) : a.mine === "confirmed" || a.mine === "absent" ? null : me ? (
            <form action={joinActivity.bind(null, a.id)}>
              <Button type="submit" className="w-full">{full ? t("Join the waitlist") : t("Join")}</Button>
            </form>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(`/app/activities/${a.id}`)}`} className="block rounded-xl bg-brand-500 px-4 py-2.5 text-center font-semibold text-ink hover:bg-brand-400">{t("Log in to join")}</Link>
          )}
        </section>
      )}
      {a.mine === "confirmed" && <div className="mt-3"><Notice tone="success">{t("Your hours were confirmed. They are on your profile.")}</Notice></div>}
      {a.mine === "absent" && <div className="mt-3"><Notice tone="info">{t("The organiser marked you absent.")}</Notice></div>}
      {inChat && (
        <Link href={`/app/messages/${a.conversation_id}`} className="card mt-3 flex items-center gap-3 px-4 py-3 font-semibold hover:bg-brand-50">
          <MessageCircle className="size-5 text-brand-800" />{t("Group chat")}
        </Link>
      )}

      {isOrganiser && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-ink-muted">{t("Volunteers")} · {volunteers.length}</h2>
          {volunteers.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">{t("No one has joined yet.")}</p>
          ) : (
            <ul className="card mt-2 divide-y divide-stone-100">
              {volunteers.map((v) => (
                <li key={v.user.id} className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <AvatarImg name={v.user.display_name} url={v.user.avatar_url} />
                    <Link href={`/app/providers/${v.user.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{v.user.display_name}</Link>
                    <Pill tone={v.status === "confirmed" ? "green" : v.status === "absent" ? "red" : v.status === "waitlist" ? "amber" : "neutral"}>
                      {t(label(v.status))}{v.status === "confirmed" && v.hours !== null ? ` · ${v.hours} h` : ""}
                    </Pill>
                  </div>
                  {started && !cancelled && v.status !== "waitlist" && (
                    <form className="mt-2 flex flex-wrap items-center gap-2">
                      <input name="hours" type="number" step="0.5" min="0" max="24" placeholder={t("Hours")} aria-label={t("Hours")} className={`${inputClass} w-24 py-1.5 text-sm`} />
                      <Button type="submit" formAction={confirmVolunteer.bind(null, a.id, v.user.id, true)} className="px-3 py-1.5 text-sm">{t("Present")}</Button>
                      <Button type="submit" variant="secondary" formAction={confirmVolunteer.bind(null, a.id, v.user.id, false)} className="px-3 py-1.5 text-sm">{t("Absent")}</Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!started && !cancelled && <p className="mt-2 text-xs text-ink-muted">{t("You can confirm who came once the activity has started.")}</p>}
          {!cancelled && !ended && (
            <form action={cancelActivity.bind(null, a.id)} className="mt-4">
              <button type="submit" className="text-sm font-medium text-red-700 underline">{t("Cancel this activity")}</button>
            </form>
          )}
        </section>
      )}
    </main>
  );
}
