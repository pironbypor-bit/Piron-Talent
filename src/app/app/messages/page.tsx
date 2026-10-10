import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { getMe, listConversations } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Messages") };
}

export default async function MessagesPage() {
  const [t, locale, me, conversations] = await Promise.all([getT(), getLocale(), getMe(), listConversations()]);
  return (
    <main className="px-4 py-4">
      <h1 className="text-xl font-bold">{t("Messages")}</h1>
      <p className="text-sm text-ink-muted">{t("Messaging opens only after a quote or an invitation, so nobody receives unwanted messages.")}</p>
      {conversations.length === 0 ? (
        <div className="mt-6">
          <EmptyState>{t("No messages yet.")}</EmptyState>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-stone-200 rounded-2xl bg-white shadow-sm">
          {conversations.map((c) => {
            const name = c.other?.display_name ?? "?";
            const mine = c.last?.sender_id === me?.id;
            return (
              <li key={c.id}>
                <Link href={`/app/messages/${c.id}`} className="flex items-center gap-3 px-3 py-3 hover:bg-stone-50">
                  <AvatarImg name={name} url={c.other?.avatar_url ?? null} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-semibold">{name}</p>
                      {c.last && <span className="shrink-0 text-xs text-ink-muted">{formatDate(c.last.created_at, locale)}</span>}
                    </div>
                    {c.last && (
                      <p className="truncate text-sm text-ink-muted">
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
