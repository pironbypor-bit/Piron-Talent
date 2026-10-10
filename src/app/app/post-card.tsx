import Link from "next/link";
import { Pill } from "@/components/ui";
import { toggleCheer, toggleKeepPost } from "@/lib/app/actions";
import { KIND_LABEL, type PostRow } from "@/lib/app/types";
import { formatDate } from "@/lib/dates";
import type { Locale, T } from "@/lib/i18n/core";
import { AvatarImg } from "./avatar";

const TONE: Record<string, "amber" | "green" | "neutral"> = { need_help: "amber", offer_skill: "green", share_knowledge: "neutral", hire_shift: "neutral" };

/** One Workspace post. Cheer and Keep are forms posting to server actions, so they work without client JS. */
export function PostCard({ post, t, locale, path, me, full = false }: { post: PostRow; t: T; locale: Locale; path: string; me: string | null; full?: boolean }) {
  const cheer = toggleCheer.bind(null, post.id, path);
  const keep = toggleKeepPost.bind(null, post.id, path);
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AvatarImg name={post.author.display_name} url={post.author.avatar_url} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            <Link href={`/app/providers/${post.author.id}`} className="hover:underline">
              {post.author.display_name}
            </Link>
            {post.author.identity_checked && (
              <span className="ml-2 align-middle">
                <Pill tone="green">{t("Identity checked")}</Pill>
              </span>
            )}
          </p>
          <p className="text-sm text-ink-muted">
            {post.author.role_line ? `${post.author.role_line} · ` : ""}
            {formatDate(post.created_at, locale)}
          </p>
        </div>
        <Pill tone={TONE[post.kind]}>{t(KIND_LABEL[post.kind])}</Pill>
      </div>
      <h2 className="mt-3 text-lg font-semibold leading-snug">
        {full ? post.title : <Link href={`/app/post/${post.id}`} className="hover:underline">{post.title}</Link>}
      </h2>
      <p className={`mt-1 whitespace-pre-wrap leading-relaxed ${full ? "" : "line-clamp-4"}`}>{post.body}</p>
      {(post.place || post.price_text) && (
        <p className="mt-2 text-sm text-ink-muted">
          {[post.place, post.price_text].filter(Boolean).join(" · ")}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <form action={cheer}>
          <button type="submit" aria-pressed={post.cheered} className={`rounded-full border px-3 py-1.5 ${post.cheered ? "border-brand-400 bg-brand-100 font-medium" : "border-stone-300 hover:bg-stone-50"}`}>
            {t("Cheer")} · {post.cheers}
          </button>
        </form>
        <Link href={`/app/post/${post.id}`} className="rounded-full border border-stone-300 px-3 py-1.5 hover:bg-stone-50">
          {t("{n} comments", { n: post.comments })}
        </Link>
        <form action={keep}>
          <button type="submit" aria-pressed={post.kept} className={`rounded-full border px-3 py-1.5 ${post.kept ? "border-brand-400 bg-brand-100 font-medium" : "border-stone-300 hover:bg-stone-50"}`}>
            {post.kept ? t("Kept") : t("Keep")}
          </button>
        </form>
        {me !== post.author.id && (
          <Link href={`/app/post/${post.id}#connect`} className="rounded-full bg-brand-500 px-3 py-1.5 font-medium text-ink hover:bg-brand-400">
            {t("Connect")}
          </Link>
        )}
      </div>
    </article>
  );
}
