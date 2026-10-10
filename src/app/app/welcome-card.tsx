import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { T } from "@/lib/i18n/core";

/** First-run checklist on Home. Disappears once all three steps are done. */
export function WelcomeCard({ t, steps }: { t: T; steps: { label: string; href: string; done: boolean }[] }) {
  const left = steps.filter((s) => !s.done).length;
  if (left === 0) return null;
  return (
    <section className="card mt-4 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{t("Get started")}</p>
      <h2 className="text-lg font-bold">{t("Three steps to your first job")}</h2>
      <ol className="mt-3 space-y-2">
        {steps.map((s) => (
          <li key={s.label}>
            {s.done ? (
              <p className="flex items-center gap-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-900">
                <span className="flex size-6 items-center justify-center rounded-full bg-green-600 text-white">
                  <Check className="size-3.5" />
                </span>
                <span className="line-through">{s.label}</span>
                <span className="ml-auto text-xs">{t("Done")}</span>
              </p>
            ) : (
              <Link href={s.href} className="flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium hover:bg-brand-100">
                <span className="size-6 rounded-full border-2 border-brand-400" />
                {s.label}
                <ChevronRight className="ml-auto size-4 text-ink-muted" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
