import Link from "next/link";
import { Bookmark, MessageSquare, Smile, UserPlus } from "lucide-react";
import { CheckedPill, Pill } from "@/components/ui";
import { toggleCheer, toggleKeepPost } from "@/lib/app/actions";
import { KIND_LABEL, type PostRow } from "@/lib/app/types";
import { formatDate } from "@/lib/dates";
import type { Locale, T } from "@/lib/i18n/core";
import { AvatarImg } from "./avatar";

const TONE: Record<string, "amber" | "green" | "neutral"> = { need_help: "amber", offer_skill: "green", share_knowledge: "neutral", hire_shift: "neutral" };

const chip = (on: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-brand-400 bg-brand-100 font-medium text-brand-900" : "border-stone-200 bg-white hover:bg-brand-50"}`;

/** One Workspace post. Cheer and Keep are forms posting to server actions, so they work without client JS. */
export function PostCard({ post, t, locale, path, me, full = false }: { post: PostRow; t: T; locale: Locale; path: string; me: string | null; full?: boolean }) {
  const cheer = toggleCheer.bind(null, post.id, path);
  const keep = toggleKeepPost.bind(null, post.id, path);
  return (
    <article className="card p-4">
      <div className="flex items-start gap-3">
        <AvatarImg name={post.author.display_name} url={post.author.avatar_url} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold leading-tight">
            <Link href={`/app/providers/${post.author.id}`} className="hover:underline">
              {post.author.display_name}
            </Link>
            {post.author.identity_checked && <CheckedPill>{t("Identity checked")}</CheckedPill>}
          </p>
          <p className="text-xs text-ink-muted">
            {post.author.role_line ? `${post.author.role_line} · ` : ""}
            {formatDate(post.created_at, locale)}
          </p>
        </div>
        <Pill tone={TONE[post.kind]}>{t(KIND_LABEL[post.kind])}</Pill>
      </div>
      <h2 className="mt-3 text-lg font-semibold leading-snug">
        {full ? post.title : <Link href={`/app/post/${post.id}`} className="hover:underline">{post.title}</Link>}
      </h2>
      <p className={`mt-1 whitespace-pre-wrap leading-relaxed text-ink ${full ? "" : "line-clamp-4"}`}>{post.body}</p>
      {(post.place || post.price_text || post.budget_min !== null || post.budget_max !== null || post.deadline) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {post.place && <span className="rounded-full bg-stone-100 px-2.5 py-1">{post.place}</span>}
          {post.price_text && <span className="rounded-full bg-brand-100 px-2.5 py-1 font-semibold text-brand-900">{post.price_text}</span>}
          {(post.budget_min !== null || post.budget_max !== null) && (
            <span className="rounded-full bg-brand-100 px-2.5 py-1 font-semibold text-brand-900">
              {[post.budget_min, post.budget_max].filter((n) => n !== null).map((n) => `${n}`).join(" - ")}
            </span>
          )}
          {post.deadline && <span className="rounded-full bg-stone-100 px-2.5 py-1">{formatDate(post.deadline, locale)}</span>}
          {post.kind === "need_help" && post.remote && <span className="rounded-full bg-stone-100 px-2.5 py-1">{t("Remote")}</span>}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <form action={cheer}>
          <button type="submit" aria-pressed={post.cheered} className={chip(post.cheered)}>
            <Smile className="size-4" /> {t("Cheer")} {post.cheers > 0 && <span className="text-ink-muted">· {post.cheers}</span>}
          </button>
        </form>
        <Link href={`/app/post/${post.id}`} className={chip(false)}>
          <MessageSquare className="size-4" /> {post.comments}
        </Link>
        <form action={keep}>
          <button type="submit" aria-pressed={post.kept} className={chip(post.kept)} aria-label={post.kept ? t("Kept") : t("Keep")}>
            <Bookmark className={`size-4 ${post.kept ? "fill-current" : ""}`} /> {post.kept ? t("Kept") : t("Keep")}
          </button>
        </form>
        {me !== post.author.id && (
          <Link href={`/app/post/${post.id}#connect`} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-brand-400">
            <UserPlus className="size-4" /> {t("Connect")}
          </Link>
        )}
      </div>
    </article>
  );
}
