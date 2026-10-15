import Link from "next/link";
import { Briefcase, HeartHandshake, Lightbulb, Sparkles } from "lucide-react";
import type { T } from "@/lib/i18n/core";

const QUICK = [
  { kind: "need_help", label: "Post a job offer", Icon: Briefcase, tone: "bg-brand-100 text-brand-900" },
  { kind: "offer_skill", label: "Offer a skill", Icon: Sparkles, tone: "bg-green-100 text-green-900" },
  { kind: "share_knowledge", label: "Share what you know", Icon: Lightbulb, tone: "bg-stone-100 text-ink" },
] as const;

const TILE = "flex flex-col items-center gap-1 rounded-2xl bg-white/90 px-2 py-3 text-center text-xs font-medium shadow-sm hover:bg-white";

/** Front page of "Write a post": pick what to do, then the form opens with that kind chosen. */
export function StartChooser({ t, name }: { t: T; name: string | null }) {
  return (
    <section className="hero-amber rounded-3xl p-4">
      <p className="text-lg font-bold">{name ? t("Good to see you, {name}", { name }) : t("Workspace")}</p>
      <p className="text-sm text-brand-900">{name ? t("What would you like to do today?") : t("Browse without an account, or log in to take part.")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {QUICK.map(({ kind, label, Icon, tone }) => (
          <Link key={kind} href={`/app/post/new?kind=${kind}`} className={TILE}>
            <span className={`flex size-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="size-5" />
            </span>
            {t(label)}
          </Link>
        ))}
        <Link href="/app/activities" className={TILE}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-rose-100 text-rose-900">
            <HeartHandshake className="size-5" />
          </span>
          {t("Volunteer")}
        </Link>
      </div>
    </section>
  );
}
