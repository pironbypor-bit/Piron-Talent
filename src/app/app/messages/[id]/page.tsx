import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogOut, Users, X } from "lucide-react";
import { Button, inputClass } from "@/components/ui";
import { addGroupMembers, leaveGroup, removeGroupMember, sendMessage } from "@/lib/app/actions";
import { getConversation, getMe, groupCandidates } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../avatar";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getConversation(id);
  return { title: data?.title ?? data?.other?.display_name ?? "Messages" };
}

export default async function ConversationPage({ params }: Props) {
  const [{ id }, t, locale, me] = await Promise.all([params, getT(), getLocale(), getMe()]);
  const data = await getConversation(id);
  if (!data || !me) notFound();
  const { other, messages, kind, members, iAmOwner } = data;
  const group = kind === "group";
  const send = sendMessage.bind(null, id);
  const name = group ? (data.title ?? "") : other?.display_name ?? "?";
  const nameOf = new Map(members.map((m) => [m.id, m.display_name]));
  // People the owner can still add: contacts (and project quoters) who are not members yet.
  const addable = group && iAmOwner && members.length < 20 ? (await groupCandidates(data.postId)).filter((p) => !members.some((m) => m.id === p.id)) : [];
  // Day separators: show the date when it changes from the previous message.
  const days = messages.map((m) => formatDate(m.created_at, locale));

  return (
    <main className="flex min-h-full flex-col px-4 py-4">
      <div className="flex items-center gap-3">
        <Link href="/app/messages" className="text-sm font-medium underline">
          {t("Back")}
        </Link>
        {group ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-800"><Users className="size-5" /></span>
        ) : (
          <AvatarImg name={name} url={other?.avatar_url ?? null} />
        )}
        <div className="min-w-0">
          {!group && other ? (
            <Link href={`/app/providers/${other.id}`} className="font-semibold hover:underline">
              {name}
            </Link>
          ) : (
            <p className="truncate font-semibold">{name}</p>
          )}
          {group ? <p className="text-xs text-ink-muted">{t("{n} people", { n: members.length })}</p> : other?.role_line && <p className="truncate text-xs text-ink-muted">{other.role_line}</p>}
        </div>
      </div>

      {group && (
        <details className="card mt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            {t("Members")} · {members.length}
            <span className="text-ink-muted">›</span>
          </summary>
          <ul className="divide-y divide-stone-100 border-t border-stone-100">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-2">
                <AvatarImg name={m.display_name} url={m.avatar_url} />
                <span className="min-w-0 flex-1">
                  <Link href={`/app/providers/${m.id}`} className="block truncate text-sm font-medium hover:underline">{m.display_name}{m.id === me.id ? ` (${t("You")})` : ""}</Link>
                  {m.role === "owner" && <span className="text-xs text-ink-muted">{t("Owner")}</span>}
                </span>
                {iAmOwner && m.id !== me.id && (
                  <form action={removeGroupMember.bind(null, id, m.id)}>
                    <button type="submit" aria-label={t("Remove")} className="rounded-full p-1.5 text-ink-muted hover:bg-stone-100"><X className="size-4" /></button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {addable.length > 0 && (
            <form action={addGroupMembers.bind(null, id)} className="border-t border-stone-100 px-4 py-3">
              <p className="text-sm font-medium">{t("Add people")}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {addable.map((p) => (
                  <li key={p.id}>
                    <label className="cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-1 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-100">
                      <input type="checkbox" name="members" value={p.id} className="sr-only" />{p.display_name}
                    </label>
                  </li>
                ))}
              </ul>
              <Button type="submit" className="mt-2 px-3 py-1.5 text-sm">{t("Add")}</Button>
            </form>
          )}
          <form action={leaveGroup.bind(null, id)} className="border-t border-stone-100 px-4 py-2">
            <button type="submit" className="inline-flex items-center gap-2 text-sm font-medium text-red-700"><LogOut className="size-4" />{t("Leave group")}</button>
          </form>
        </details>
      )}

      <ol className="mt-4 flex-1 space-y-2">
        {messages.map((m, i) => {
          const day = days[i];
          const showDay = i === 0 || day !== days[i - 1];
          const mine = m.sender_id === me.id;
          const showName = group && !mine && (i === 0 || messages[i - 1].sender_id !== m.sender_id || showDay);
          return (
            <li key={m.id}>
              {showDay && <p className="my-2 text-center text-xs text-ink-muted">{day}</p>}
              {showName && <p className="ml-1 text-xs font-medium text-ink-muted">{nameOf.get(m.sender_id) ?? "?"}</p>}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${mine ? "bg-brand-100" : "card"}`}>{m.body}</p>
              </div>
            </li>
          );
        })}
        {group && messages.length === 0 && <li className="text-center text-sm text-ink-muted">{t("Say something to the group.")}</li>}
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
