import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui";
import { Faq, PilotNote, TrustBlock } from "@/components/home-blocks";
import { getCategories } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { SEGMENTS, segmentBySlug } from "@/lib/segments";

type Props = { params: Promise<{ segment: string }> };

export function generateStaticParams() {
  return SEGMENTS.map((s) => ({ segment: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ segment }, t] = await Promise.all([params, getT()]);
  const s = segmentBySlug(segment);
  return { title: s ? t(s.kicker) : "Piron Work", description: s ? t(s.lead) : undefined };
}

/** Segment landing page: one audience, its three points, example tasks that prefill the form, and the same trust blocks as home. */
export default async function SegmentPage({ params }: Props) {
  const [{ segment }, t, categories] = await Promise.all([params, getT(), getCategories()]);
  const s = segmentBySlug(segment);
  if (!s) notFound();
  const catId = (slug: string) => categories.find((c) => c.slug === slug)?.id;
  const formPath = s.side === "customer" ? "/post-project" : "/join";
  const link = (task?: { category: string; details?: string }) => {
    const p = new URLSearchParams({ source: s.slug });
    const id = task ? catId(task.category) : undefined;
    if (id) p.set("category", String(id));
    if (task?.details) p.set("details", t(task.details));
    return `${formPath}?${p.toString()}`;
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-sm font-medium text-brand-800">{t(s.kicker)}</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t(s.title)}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">{t(s.lead)}</p>
      <p className="mt-6">
        <Link href={link()} className="inline-block">
          <Button type="button">{t(s.cta)}</Button>
        </Link>
      </p>

      <ul className="mt-10 grid gap-3 sm:grid-cols-3">
        {s.points.map((x) => (
          <li key={x} className="rounded-2xl border border-brand-300 bg-brand-50 p-4 text-sm leading-relaxed">
            {t(x)}
          </li>
        ))}
      </ul>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">{s.side === "customer" ? t("Common tasks") : t("Skills we match first")}</h2>
        <p className="mt-1 text-ink-muted">{s.side === "customer" ? t("Pick one to start the form with it filled in.") : t("Pick the one closest to what you do.")}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {s.tasks.map((task) => (
            <li key={task.label}>
              <Link href={link(task)} className="inline-block rounded-full border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-brand-50">
                {t(task.label)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <TrustBlock t={t} />
      </div>
      <div className="mt-12">
        <Faq t={t} />
      </div>
      <div className="mt-10">
        <PilotNote t={t} />
      </div>
      <p className="mt-8 flex flex-wrap items-center gap-4">
        <Link href={link()} className="inline-block">
          <Button type="button">{t(s.cta)}</Button>
        </Link>
        <Link href="/" className="text-sm font-medium underline">
          {t("Back to home")}
        </Link>
      </p>
    </main>
  );
}
