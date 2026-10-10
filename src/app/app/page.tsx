import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Lightbulb, Plus, Sparkles } from "lucide-react";
import { EmptyState, Notice } from "@/components/ui";
import { EmptyIllustration } from "@/components/illustrations";
import { getMe, listPosts, myCounters, myIdentityStatus } from "@/lib/app/queries";
import { WelcomeCard } from "./welcome-card";
import { KIND_LABEL, type PostKind } from "@/lib/app/types";
import { getLocale, getT } from "@/lib/i18n/server";
import { PostCard } from "./post-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Workspace") };
}

const KINDS: (PostKind | "all")[] = ["all", "need_help", "offer_skill", "share_knowledge"];
const QUICK = [
  { kind: "need_help", label: "Post a job offer", Icon: Briefcase, tone: "bg-brand-100 text-brand-900" },
  { kind: "offer_skill", label: "Offer a skill", Icon: Sparkles, tone: "bg-green-100 text-green-900" },
  { kind: "share_knowledge", label: "Share what you know", Icon: Lightbulb, tone: "bg-stone-100 text-ink" },
] as const;

/** Home tab: the Workspace on real posts. Filtering is by URL so the page stays a plain server render. */
export default async function AppHome({ searchParams }: { searchParams: Promise<{ kind?: string; error?: string }> }) {
  const [t, locale, me, posts, { kind, error }, counters, identity] = await Promise.all([getT(), getLocale(), getMe(), listPosts(), searchParams, myCounters(), myIdentityStatus()]);
  const steps = me
    ? [
        { label: t("Complete your profile"), href: "/app/profile/edit", done: !!(me.role_line && me.avatar_url) },
        { label: t("Start the identity check"), href: "/app/profile", done: identity !== "none" },
        { label: t("Write your first post"), href: "/app/post/new", done: counters.posts > 0 },
      ]
    : [];
  const active = (KINDS as string[]).includes(kind ?? "") ? (kind as PostKind | "all") : "all";
  const list = posts.filter((p) => active === "all" || p.kind === active);

  return (
    <main className="px-4 pb-24 pt-4">
      <section className="hero-amber rounded-3xl p-4">
        <p className="text-lg font-bold">{me ? t("Good to see you, {name}", { name: me.display_name }) : t("Workspace")}</p>
        <p className="text-sm text-brand-900">{me ? t("What would you like to do today?") : t("Browse without an account, or log in to take part.")}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {QUICK.map(({ kind: k, label, Icon, tone }) => (
            <Link key={k} href={`/app/post/new?kind=${k}`} className={`flex flex-col items-center gap-1 rounded-2xl bg-white/90 px-2 py-3 text-center text-xs font-medium shadow-sm hover:bg-white`}>
              <span className={`flex size-9 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="size-5" />
              </span>
              {t(label)}
            </Link>
          ))}
        </div>
      </section>

      {me && <WelcomeCard t={t} steps={steps} />}
      {error && <div className="mt-3"><Notice tone="error">{t("Something went wrong: {error}", { error })}</Notice></div>}

      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
        {KINDS.map((k) => (
          <Link
            key={k}
            href={k === "all" ? "/app" : `/app?kind=${k}`}
            aria-current={active === k ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${active === k ? "bg-ink text-white" : "card hover:bg-brand-50"}`}
          >
            {k === "all" ? t("All posts") : t(KIND_LABEL[k])}
          </Link>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-muted">{t("Newest first. No ranking, no ads. Phnom Penh only.")}</p>

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
            {t("No posts yet. Be the first.")}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((p) => (
            <PostCard key={p.id} post={p} t={t} locale={locale} path={active === "all" ? "/app" : `/app?kind=${active}`} me={me?.id ?? null} />
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
