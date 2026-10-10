"use client";

import { useState } from "react";
import { threads } from "@/lib/demo/app-fixtures";
import { pick, providerBySlug } from "@/lib/demo/fixtures";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { Avatar } from "../../demo-ui";
import { Thread } from "../../messages/thread";

/** Thread list; the first thread opens the sample conversation in place. */
export function ThreadList({ locale }: { locale: Locale }) {
  const t = useT();
  const [open, setOpen] = useState<string | null>(null);

  if (open) {
    return (
      <div className="mt-3">
        <button type="button" onClick={() => setOpen(null)} className="mb-3 text-sm font-medium underline">
          {t("Back")}
        </button>
        <Thread locale={locale} />
      </div>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-stone-200 rounded-2xl bg-white shadow-sm">
      {threads.map((th) => {
        const p = providerBySlug(th.provider)!;
        const name = pick(p.name, locale);
        return (
          <li key={th.provider}>
            <button type="button" onClick={() => setOpen(th.provider)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-stone-50">
              <Avatar name={name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`truncate ${th.unread ? "font-bold" : "font-semibold"}`}>{name}</p>
                  <span className="shrink-0 text-xs text-ink-muted">{th.time === "Yesterday" ? t("Yesterday") : th.time}</span>
                </div>
                <p className={`truncate text-sm ${th.unread ? "text-ink" : "text-ink-muted"}`}>{pick(th.last, locale)}</p>
              </div>
              {th.unread && <span className="size-2.5 shrink-0 rounded-full bg-brand-500" aria-label={t("New message")} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
