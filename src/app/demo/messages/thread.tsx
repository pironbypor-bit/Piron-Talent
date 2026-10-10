"use client";

import { useState } from "react";
import { Button, Notice, inputClass } from "@/components/ui";
import { pick, providerBySlug, story, type L } from "@/lib/demo/fixtures";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";
import { Avatar } from "../demo-ui";

const MESSAGES: { from: "provider" | "customer"; time: string; text: L }[] = [
  { from: "provider", time: "09:12", text: { en: "Hello! I sent a quote for the 12 menu photos. Is Thursday morning before opening OK for the shoot?", km: "សួស្តី! ខ្ញុំបានផ្ញើសម្រង់តម្លៃសម្រាប់រូបថតមុខម្ហូប 12 មុខ។ ព្រឹកថ្ងៃព្រហស្បតិ៍មុនបើកហាង អាចថតបានទេ?" } },
  { from: "customer", time: "09:30", text: { en: "Yes, 7:30 works. Do you need a table near the window?", km: "បាន ម៉ោង 7:30 ល្អ។ តើអ្នកត្រូវការតុជិតបង្អួចទេ?" } },
  { from: "provider", time: "09:31", text: { en: "Perfect. A window table and the white plates you mentioned. I will bring the backdrop.", km: "ល្អណាស់។ តុជិតបង្អួច និងចានពណ៌សដែលអ្នកបាននិយាយ។ ខ្ញុំនឹងយកផ្ទៃខាងក្រោយមក។" } },
];

/** One sample conversation tied to the cafe project. Sending shows what would happen; nothing is stored. */
export function Thread({ locale }: { locale: Locale }) {
  const t = useT();
  const provider = providerBySlug(story.quotes[0].provider)!;
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const providerName = pick(provider.name, locale);

  return (
    <div className="rounded-xl border border-stone-200">
      <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
        <Avatar name={providerName} />
        <div>
          <p className="font-semibold">{providerName}</p>
          <p className="text-sm text-ink-muted">{pick(story.title, locale)}</p>
        </div>
      </div>
      <ol className="space-y-3 px-4 py-4">
        <li className="text-center text-xs text-ink-muted">{t("Today")}</li>
        {MESSAGES.map((m, i) => (
          <li key={i} className={`flex ${m.from === "customer" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.from === "customer" ? "bg-brand-100" : "bg-stone-100"}`}>
              <p className="text-xs text-ink-muted">
                {m.from === "customer" ? t("You") : providerName} · {m.time}
              </p>
              <p>{pick(m.text, locale)}</p>
            </div>
          </li>
        ))}
      </ol>
      <form
        className="flex gap-2 border-t border-stone-200 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
          setDraft("");
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} className={inputClass} placeholder={t("Type a message")} aria-label={t("Type a message")} />
        <Button type="submit" className="px-4 py-2">
          {t("Send")}
        </Button>
      </form>
      {sent && (
        <div className="px-4 pb-4">
          <Notice tone="info">{t("In the live product the message is delivered and the other side is notified.")}</Notice>
        </div>
      )}
    </div>
  );
}
