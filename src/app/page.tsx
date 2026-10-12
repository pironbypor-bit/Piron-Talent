import Link from "next/link";
import { Button } from "@/components/ui";
import { Faq, PilotNote, TrustBlock } from "@/components/home-blocks";
import { categoryLabel, getCategories } from "@/lib/categories";
import { providers } from "@/lib/demo/fixtures";
import { getLocale, getT } from "@/lib/i18n/server";
import { SEGMENTS } from "@/lib/segments";
import { ProviderCard } from "@/app/demo/demo-ui";

// Homepage ("two doors", chosen by the owner on 2026-10-10 from the proposals under /design).
// One headline for both sides, a door each with three steps, then proof: what we check, sample providers, categories.

const LAUNCH = ["creative", "technology", "documents", "finance"];
const DISTRICTS: Record<"en" | "km", string[]> = {
  en: ["Toul Kork", "BKK", "Sen Sok", "Chbar Ampov", "Russian Market", "Riverside"],
  km: ["ទួលគោក", "បឹងកេងកង", "សែនសុខ", "ច្បារអំពៅ", "ផ្សារទួលទំពូង", "មាត់ទន្លេ"],
};

export default async function Home() {
  const [t, locale, categories] = await Promise.all([getT(), getLocale(), getCategories()]);
  const launch = categories.filter((c) => LAUNCH.includes(c.slug));
  const featured = providers.slice(0, 3);

  const doors = [
    {
      href: "/post-project",
      kicker: t("For businesses and households"),
      title: t("I need help"),
      steps: [t("Post what you need in Khmer or English"), t("Compare two or three quotes"), t("Pay the provider directly when done")],
      cta: t("Post a project"),
      primary: true,
    },
    {
      href: "/join",
      kicker: t("For freelancers and professionals"),
      title: t("I offer a skill"),
      steps: [t("Show your past work"), t("Quote on projects that fit"), t("Every completed job builds your record")],
      cta: t("Join as a provider"),
      primary: false,
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800">
        <span className="size-2 rounded-full bg-brand-500" />
        {t("Pilot programme, 2027")} · {t("Phnom Penh only for now.")}
      </p>
      <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t("Skilled help for your business. Real work for your skills.")}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
        {t("A Phnom Penh network where small businesses find checked providers, and providers turn good work into repeat customers.")}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {doors.map((d) => (
          <section key={d.href} className={`rounded-3xl border p-6 ${d.primary ? "border-brand-300 bg-brand-50" : "border-stone-200"}`}>
            <p className={`text-sm font-medium ${d.primary ? "text-brand-800" : "text-ink-muted"}`}>{d.kicker}</p>
            <h2 className="mt-1 text-2xl font-bold">{d.title}</h2>
            <ol className="mt-4 space-y-2">
              {d.steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm leading-relaxed">
                  <span className="font-bold text-brand-700">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <Link href={d.href} className="mt-5 inline-block">
              <Button type="button" variant={d.primary ? "primary" : "secondary"}>
                {d.cta}
              </Button>
            </Link>
          </section>
        ))}
      </div>
      <p className="mt-4 flex flex-wrap items-center gap-4">
        <Link href="/app" className="inline-block">
          <Button type="button">{t("Open the app")}</Button>
        </Link>
        <Link href="/providers" className="text-sm font-medium underline">
          {t("Browse providers")}
        </Link>
        <Link href="/demo" className="text-sm font-medium underline">
          {t("See a sample project")}
        </Link>
      </p>

      <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
        {SEGMENTS.map((s) => (
          <Link key={s.slug} href={`/for/${s.slug}`} className="underline hover:text-ink">
            {t(s.kicker)}
          </Link>
        ))}
      </p>

      <div className="mt-12">
        <TrustBlock t={t} />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">{t("Providers in the pilot")}</h2>
        <p className="mt-1 text-ink-muted">{t("Sample profiles. Real providers appear here after the first completed jobs.")}</p>
        <ul className="mt-5 space-y-3">
          {featured.map((p) => (
            <li key={p.slug} className="rounded-2xl border border-stone-200 p-4">
              <ProviderCard
                provider={p}
                locale={locale}
                t={t}
                action={
                  <Link href={`/demo/providers/${p.slug}`} className="shrink-0 text-sm font-medium underline">
                    {t("View profile")}
                  </Link>
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">{t("Launch categories")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {launch.map((c) => (
              <li key={c.id} className="rounded-full border border-stone-300 px-3 py-1.5 text-sm">
                {categoryLabel(c, locale)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink-muted">{t("More categories open after the pilot.")}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold">{t("Working in")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {DISTRICTS[locale].map((d) => (
              <li key={d} className="rounded-full bg-stone-100 px-3 py-1.5 text-sm">
                {d}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-12">
        <Faq t={t} />
      </div>
      <div className="mt-10">
        <PilotNote t={t} />
      </div>
    </main>
  );
}
