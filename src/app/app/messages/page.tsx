import type { Metadata } from "next";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { EmptyIllustration } from "@/components/illustrations";
import { answerHello } from "@/lib/app/actions";
import { getMe, listConversations, myMessageRequests } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Messages") };
}

export default async function MessagesPage() {
  const [t, locale, me, conversations, requests] = await Promise.all([getT(), getLocale(), getMe(), listConversations(), myMessageRequests()]);
  return (
    <main className="px-4 pb-24 pt-4">
      <section className="hero-amber rounded-3xl p-4">
        <h1 className="text-xl font-bold">{t("Messages")}</h1>
        <p className="text-sm text-brand-900">{t("Messaging opens after a quote or an invitation, or when you accept a request. Nobody receives unwanted messages.")}</p>
      </section>
      {requests.incoming.length > 0 && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-ink-muted">{t("Message requests")} · {requests.incoming.length}</h2>
          <ul className="card mt-2 divide-y divide-stone-100">
            {requests.incoming.map((r) => (
              <li key={r.id} className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <AvatarImg name={r.other.display_name} url={r.other.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/app/providers/${r.other.id}`} className="block truncate font-semibold hover:underline">{r.other.display_name}</Link>
                    <span className="text-xs text-ink-muted">{formatDate(r.created_at, locale)}</span>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>
                <div className="mt-2 flex gap-2">
                  <form action={answerHello.bind(null, r.id, true)}>
                    <Button type="submit" className="px-3 py-1.5 text-sm">{t("Accept")}</Button>
                  </form>
                  <form action={answerHello.bind(null, r.id, false)}>
                    <Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">{t("Not now")}</Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {requests.outgoing.length > 0 && (
        <p className="mt-3 text-xs text-ink-muted">
          {t("Waiting for an answer")}: {requests.outgoing.map((r) => r.other.display_name).join(", ")}
        </p>
      )}
      {conversations.length === 0 ? (
        <div className="mt-6">
          <EmptyState illustration={<EmptyIllustration kind="messages" />}>{t("No messages yet.")}</EmptyState>
        </div>
      ) : (
        <ul className="card mt-4 divide-y divide-stone-100">
          {conversations.map((c) => {
            const name = c.other?.display_name ?? "?";
            const mine = c.last?.sender_id === me?.id;
            return (
              <li key={c.id}>
                <Link href={`/app/messages/${c.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-stone-50">
                  <AvatarImg name={name} url={c.other?.avatar_url ?? null} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate ${c.unread ? "font-bold" : "font-semibold"}`}>
                        {c.unread && <span className="mr-1.5 inline-block size-2 rounded-full bg-brand-500 align-middle" aria-label={t("Unread")} />}
                        {name}
                      </p>
                      {c.last && <span className="shrink-0 text-xs text-ink-muted">{formatDate(c.last.created_at, locale)}</span>}
                    </div>
                    {c.last && (
                      <p className={`truncate text-sm ${c.unread ? "font-medium text-ink" : "text-ink-muted"}`}>
                        {mine ? `${t("You")}: ` : ""}
                        {c.last.body}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
