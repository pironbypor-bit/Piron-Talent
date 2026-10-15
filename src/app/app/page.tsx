import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyState, Notice } from "@/components/ui";
import { EmptyIllustration } from "@/components/illustrations";
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
export default async function AppHome({ searchParams }: { searchParams: Promise<{ kind?: string; error?: string; q?: string }> }) {
  const [t, locale, me, { kind, error, q }] = await Promise.all([getT(), getLocale(), getMe(), searchParams]);
  const word = (q ?? "").trim().slice(0, 60);
  const posts = await listPosts(40, word);
  const active = (KINDS as string[]).includes(kind ?? "") ? (kind as PostKind | "all") : "all";
  const here = `/app${active === "all" && !word ? "" : "?"}${[active === "all" ? "" : `kind=${active}`, word ? `q=${encodeURIComponent(word)}` : ""].filter(Boolean).join("&")}`;
  const list = posts.filter((p) => active === "all" || p.kind === active);

  return (
    <main className="px-4 pb-24 pt-4">
      <form action="/app" method="get" role="search" className="relative">
        {active !== "all" && <input type="hidden" name="kind" value={active} />}
        <label htmlFor="home-search" className="sr-only">{t("Search posts")}</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        <input id="home-search" name="q" type="search" defaultValue={word} maxLength={60} placeholder={t("Search jobs, skills, posts")} className="w-full rounded-full border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none focus:border-brand-500" />
      </form>
      {error && <div className="mt-3"><Notice tone="error">{t("Something went wrong: {error}", { error })}</Notice></div>}

      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        {KINDS.map((k) => (
          <Link
            key={k}
            href={`/app${k === "all" && !word ? "" : "?"}${[k === "all" ? "" : `kind=${k}`, word ? `q=${encodeURIComponent(word)}` : ""].filter(Boolean).join("&")}`}
            aria-current={active === k ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${active === k ? "bg-ink text-white" : "card hover:bg-brand-50"}`}
          >
            {k === "all" ? t("All posts") : t(KIND_LABEL[k])}
          </Link>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-muted">{word ? t("Showing posts that match “{q}”.", { q: word }) : t("Newest first. No ranking, no ads. Phnom Penh only.")}</p>

      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            illustration={<EmptyIllustration kind="posts" />}
            action={
              <Link href="/app/post/new" className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 font-semibold text-ink hover:bg-brand-400">
                <Plus className="size-4" /> {t("Write a post")}
              </Link>
            }
          >
            {word ? t("No posts match that search.") : t("No posts yet. Be the first.")}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((p) => (
            <PostCard key={p.id} post={p} t={t} locale={locale} path={here} me={me?.id ?? null} />
          ))}
        </div>
      )}

      {list.length > 0 && (
        <Link href="/app/post/new" className="fixed bottom-20 right-4 z-10 flex items-center gap-2 rounded-full bg-brand-500 px-4 py-3 font-semibold text-ink shadow-lg hover:bg-brand-400" aria-label={t("Write a post")}>
          <Plus className="size-5" />
          {t("Write a post")}
        </Link>
      )}
    </main>
  );
}
