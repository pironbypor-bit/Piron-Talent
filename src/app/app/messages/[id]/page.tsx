import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, inputClass } from "@/components/ui";
import { sendMessage } from "@/lib/app/actions";
import { getConversation, getMe } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../avatar";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getConversation(id);
  return { title: data?.other?.display_name ?? "Messages" };
}

export default async function ConversationPage({ params }: Props) {
  const [{ id }, t, locale, me] = await Promise.all([params, getT(), getLocale(), getMe()]);
  const data = await getConversation(id);
  if (!data || !me) notFound();
  const { other, messages } = data;
  const send = sendMessage.bind(null, id);
  const name = other?.display_name ?? "?";
  // Day separators: show the date when it changes from the previous message.
  const days = messages.map((m) => formatDate(m.created_at, locale));

  return (
    <main className="flex min-h-full flex-col px-4 py-4">
      <div className="flex items-center gap-3">
        <Link href="/app/messages" className="text-sm font-medium underline">
          {t("Back")}
        </Link>
        <AvatarImg name={name} url={other?.avatar_url ?? null} />
        <div className="min-w-0">
          {other ? (
            <Link href={`/app/providers/${other.id}`} className="font-semibold hover:underline">
              {name}
            </Link>
          ) : (
            <p className="font-semibold">{name}</p>
          )}
          {other?.role_line && <p className="truncate text-xs text-ink-muted">{other.role_line}</p>}
        </div>
      </div>

      <ol className="mt-4 flex-1 space-y-2">
        {messages.map((m, i) => {
          const day = days[i];
          const showDay = i === 0 || day !== days[i - 1];
          const mine = m.sender_id === me.id;
          return (
            <li key={m.id}>
              {showDay && <p className="my-2 text-center text-xs text-ink-muted">{day}</p>}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${mine ? "bg-brand-100" : "card"}`}>{m.body}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <form action={send} className="sticky bottom-0 mt-4 flex gap-2 bg-brand-50/40 py-2">
        <input name="body" className={inputClass} placeholder={t("Type a message")} aria-label={t("Type a message")} required maxLength={3000} autoComplete="off" />
        <Button type="submit" className="px-4 py-2">
          {t("Send")}
        </Button>
      </form>
    </main>
  );
}
