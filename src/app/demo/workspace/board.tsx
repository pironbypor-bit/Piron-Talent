"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, EmptyState, Notice, Pill } from "@/components/ui";
import { DEMO_CATEGORIES, categoryName, pick, posts, type PostKind } from "@/lib/demo/fixtures";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { Avatar } from "../demo-ui";

const KINDS: { key: PostKind | "all"; label: string }[] = [
  { key: "all", label: "All posts" },
  { key: "need_help", label: "Job offer" },
  { key: "offer_skill", label: "Skill offer" },
  { key: "share_knowledge", label: "Share knowledge" },
];
const KIND_TONE: Record<PostKind, "amber" | "green" | "neutral"> = { need_help: "amber", offer_skill: "green", share_knowledge: "neutral" };

/** The Workspace board: a chronological list with Cheer, Keep and Connect. Reactions live in this tab only. */
export function Board({ locale }: { locale: Locale }) {
  const t = useT();
  const [kind, setKind] = useState<PostKind | "all">("all");
  const [category, setCategory] = useState("");
  const [cheered, setCheered] = useState<Record<string, boolean>>({});
  const [kept, setKept] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string | null>(null);

  const list = posts.filter((p) => (kind === "all" || p.kind === kind) && (!category || p.category === category));
  const when = (d: number) => (d === 0 ? t("Today@@time") : d === 1 ? t("Yesterday") : t("{n} days ago", { n: d }));
  const kindLabel = (k: PostKind) => t(KINDS.find((x) => x.key === k)!.label);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKind(k.key)}
            aria-pressed={kind === k.key}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${kind === k.key ? "border-ink bg-ink text-white" : "border-stone-300 hover:bg-stone-50"}`}
          >
            {t(k.label)}
          </button>
        ))}
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-stone-300 px-3 py-1.5 text-sm" aria-label={t("Category")}>
          <option value="">{t("All categories")}</option>
          {DEMO_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {pick(c.name, locale)}
            </option>
          ))}
        </select>
        <Button type="button" variant="secondary" className="ml-auto px-3 py-1.5 text-sm" onClick={() => setNote("write")}>
          {t("Write a post")}
        </Button>
      </div>

      {note === "write" && (
        <div className="mt-4">
          <Notice tone="info">{t("In the live product this opens a short form: type, title, text, category.")}</Notice>
        </div>
      )}
      {note === "connect" && (
        <div className="mt-4">
          <Notice tone="info">{t("In the live product Connect sends an introduction. The other side accepts before any message is exchanged.")}</Notice>
        </div>
      )}

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState>{t("No posts of this type yet.")}</EmptyState>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((p) => {
            const author = pick(p.author.name, locale);
            const cheers = p.cheers + (cheered[p.id] ? 1 : 0);
            return (
              <li key={p.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={author} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {p.author.provider ? (
                        <Link href={`/demo/providers/${p.author.provider}`} className="hover:underline">
                          {author}
                        </Link>
                      ) : (
                        author
                      )}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {pick(p.author.role, locale)} · {when(p.daysAgo)} · {categoryName(p.category, locale)}
                    </p>
                  </div>
                  <Pill tone={KIND_TONE[p.kind]}>{kindLabel(p.kind)}</Pill>
                </div>
                <h2 className="mt-3 text-lg font-semibold leading-snug">{pick(p.title, locale)}</h2>
                <p className="mt-1 leading-relaxed">{pick(p.body, locale)}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setCheered({ ...cheered, [p.id]: !cheered[p.id] })}
                    aria-pressed={!!cheered[p.id]}
                    className={`rounded-full border px-3 py-1.5 ${cheered[p.id] ? "border-brand-400 bg-brand-100 font-medium" : "border-stone-300 hover:bg-stone-50"}`}
                  >
                    {t("Cheer")} · {cheers}
                  </button>
                  <button
                    type="button"
                    onClick={() => setKept({ ...kept, [p.id]: !kept[p.id] })}
                    aria-pressed={!!kept[p.id]}
                    className={`rounded-full border px-3 py-1.5 ${kept[p.id] ? "border-brand-400 bg-brand-100 font-medium" : "border-stone-300 hover:bg-stone-50"}`}
                  >
                    {kept[p.id] ? t("Kept") : t("Keep")}
                  </button>
                  {p.kind === "need_help" && p.project && (
                    <Link href={`/demo/projects/${p.project}`} className="rounded-full bg-brand-500 px-3 py-1.5 font-medium text-ink hover:bg-brand-400">
                      {t("View project")}
                    </Link>
                  )}
                  {p.kind === "offer_skill" && (
                    <button type="button" onClick={() => setNote("connect")} className="rounded-full bg-brand-500 px-3 py-1.5 font-medium text-ink hover:bg-brand-400">
                      {t("Connect")}
                    </button>
                  )}
                  {p.kind === "share_knowledge" && (
                    <span className="rounded-full border border-stone-300 px-3 py-1.5 text-ink-muted">{t("{n} comments", { n: p.comments })}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
