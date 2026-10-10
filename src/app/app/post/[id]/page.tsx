import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, inputClass, Notice } from "@/components/ui";
import { addComment, startConversation } from "@/lib/app/actions";
import { getMe, getPost } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../avatar";
import { PostCard } from "../../post-card";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPost(id);
  return { title: data?.post.title ?? "Piron Talent" };
}

export default async function PostPage({ params, searchParams }: Props) {
  const [{ id }, { error }, t, locale, me] = await Promise.all([params, searchParams, getT(), getLocale(), getMe()]);
  const data = await getPost(id);
  if (!data) notFound();
  const { post, comments } = data;
  const comment = addComment.bind(null, post.id);
  const connect = startConversation.bind(null, post.author.id);
  const path = `/app/post/${post.id}`;

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app" className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      <div className="mt-3">
        <PostCard post={post} t={t} locale={locale} path={path} me={me?.id ?? null} full />
      </div>
      {error && <div className="mt-3"><Notice tone="error">{t("Something went wrong: {error}", { error })}</Notice></div>}

      {me && me.id !== post.author.id && (
        <section id="connect" className="mt-4 rounded-2xl border border-brand-300 bg-brand-50 p-4">
          <h2 className="font-semibold">{t("Connect")}</h2>
          <p className="text-sm text-ink-muted">{t("Messaging opens only after a quote or an invitation, so nobody receives unwanted messages.")}</p>
          <form action={connect} className="mt-3 space-y-2">
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="back" value={path} />
            <textarea name="body" rows={3} className={inputClass} placeholder={t("Your message")} required />
            <Button type="submit" className="px-4 py-2 text-sm">
              {t("Send message")}
            </Button>
          </form>
        </section>
      )}
      {!me && (
        <p className="mt-4 text-sm">
          <Link href={`/login?next=${encodeURIComponent(path)}`} className="font-medium underline">
            {t("Log in to continue")}
          </Link>
        </p>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">{t("Comments")} ({comments.length})</h2>
        <ul className="mt-2 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-3 card p-3">
              <AvatarImg name={c.author.display_name} url={c.author.avatar_url} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {c.author.display_name} <span className="font-normal text-ink-muted">· {formatDate(c.created_at, locale)}</span>
                </p>
                <p className="whitespace-pre-wrap text-sm">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
        {me && (
          <form action={comment} className="mt-3 flex gap-2">
            <input name="body" className={inputClass} placeholder={t("Write a comment")} required maxLength={2000} />
            <Button type="submit" className="px-4 py-2 text-sm">
              {t("Send")}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
