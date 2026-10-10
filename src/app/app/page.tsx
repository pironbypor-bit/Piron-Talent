import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState, Notice } from "@/components/ui";
import { getMe, listPosts } from "@/lib/app/queries";
import { KIND_LABEL, type PostKind } from "@/lib/app/types";
import { getLocale, getT } from "@/lib/i18n/server";
import { PostCard } from "./post-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Workspace") };
}

const KINDS: (PostKind | "all")[] = ["all", "need_help", "offer_skill", "share_knowledge"];

/** Home tab: the Workspace on real posts. Filtering is by URL so the page stays a plain server render. */
export default async function AppHome({ searchParams }: { searchParams: Promise<{ kind?: string; error?: string }> }) {
  const [t, locale, me, posts, { kind, error }] = await Promise.all([getT(), getLocale(), getMe(), listPosts(), searchParams]);
  const active = (KINDS as string[]).includes(kind ?? "") ? (kind as PostKind | "all") : "all";
  const list = posts.filter((p) => active === "all" || p.kind === active);

  return (
    <main className="px-4 py-4">
      {!me && <p className="mb-3 rounded-xl bg-white px-3 py-2 text-sm text-ink-muted shadow-sm">{t("New here? Browse freely. Create an account to post, apply or message.")}</p>}
      {error && <div className="mb-3"><Notice tone="error">{t("Something went wrong: {error}", { error })}</Notice></div>}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {KINDS.map((k) => (
          <Link
            key={k}
            href={k === "all" ? "/app" : `/app?kind=${k}`}
            aria-current={active === k ? "page" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${active === k ? "border-ink bg-ink text-white" : "border-stone-300 bg-white hover:bg-stone-50"}`}
          >
            {k === "all" ? t("All posts") : t(KIND_LABEL[k])}
          </Link>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-muted">{t("Newest first. No ranking, no ads. Phnom Penh only.")}</p>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState>{t("No posts yet. Be the first.")}</EmptyState>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((p) => (
            <PostCard key={p.id} post={p} t={t} locale={locale} path={active === "all" ? "/app" : `/app?kind=${active}`} me={me?.id ?? null} />
          ))}
        </div>
      )}

      <Link href="/app/post/new" className="fixed bottom-20 right-4 z-10 flex items-center gap-2 rounded-full bg-brand-500 px-4 py-3 font-semibold text-ink shadow-lg hover:bg-brand-400 sm:absolute sm:bottom-20" aria-label={t("Write a post")}>
        <Plus className="size-5" />
        {t("Write a post")}
      </Link>
    </main>
  );
}
