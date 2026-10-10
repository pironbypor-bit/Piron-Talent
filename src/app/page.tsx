import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n/server";
import { categoryLabel, getCategories } from "@/lib/categories";

export default async function Home() {
  const [t, locale, categories] = await Promise.all([getT(), getLocale(), getCategories()]);
  const steps = [
    [t("Send a request"), t("Describe the work in Khmer or English. No account needed.")],
    [t("We match you"), t("Within one working day we suggest two or three suitable providers with prices.")],
    [t("Work gets done"), t("You pay the provider directly. We record the completed job so you can hire the same person again.")],
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800">
        <span className="size-2 rounded-full bg-brand-500" />
        {t("Pilot programme, 2027")}
      </p>
      <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        {t("Find the right person for your project")}
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
        {t("Tell us what you need. We match you with a checked provider in Phnom Penh and follow the work until it is done.")}
      </p>

      <p className="mt-4">
        <Link href="/demo" className="text-sm font-medium underline">
          {t("See a sample project")}
        </Link>
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/post-project" className="rounded-2xl border border-brand-300 bg-brand-50 p-6 transition hover:border-brand-500">
          <p className="text-sm font-medium text-brand-800">{t("For businesses and households")}</p>
          <p className="mt-1 text-xl font-bold">{t("Post a project")}</p>
          <p className="mt-2 leading-relaxed text-ink-muted">
            {t("Describe the task, your budget and timing. We reply within one working day.")}
          </p>
        </Link>
        <Link href="/join" className="rounded-2xl border border-stone-200 p-6 transition hover:border-brand-400">
          <p className="text-sm font-medium text-ink-muted">{t("For freelancers and professionals")}</p>
          <p className="mt-1 text-xl font-bold">{t("Join as a provider")}</p>
          <p className="mt-2 leading-relaxed text-ink-muted">
            {t("Tell us your skills and past work. We bring you clearly scoped, paid projects.")}
          </p>
        </Link>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">{t("How it works")}</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title}>
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold">{i + 1}</span>
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">{t("What people hire for")}</h2>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <li key={c.id} className="rounded-xl border border-stone-200 px-4 py-3">
              <p className="font-medium">{categoryLabel(c, locale)}</p>
              {locale === "km" && c.name_km && <p className="text-sm text-ink-muted">{c.name}</p>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
