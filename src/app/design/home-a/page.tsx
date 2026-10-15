import Link from "next/link";
import { Button, inputClass } from "@/components/ui";
import { categoryLabel, getCategories } from "@/lib/categories";
import { pick, projects } from "@/lib/demo/fixtures";
import { getLocale, getT } from "@/lib/i18n/server";
import { Faq, PilotNote, TrustBlock } from "@/components/home-blocks";
import { Dropdown } from "@/components/dropdown";

const LAUNCH = ["creative", "technology", "documents", "finance"];

/** Proposal A, "project first": the page is a request form with proof around it. For SME owners who arrive with a task in mind. */
export default async function HomeA() {
  const [t, locale, categories] = await Promise.all([getT(), getLocale(), getCategories()]);
  const launch = categories.filter((c) => LAUNCH.includes(c.slug));
  const examples = projects.map((p) => ({
    id: p.id,
    title: pick(p.title, locale),
    price: p.outcome ? `$${p.outcome.price}` : `$${p.budgetMin} - $${p.budgetMax}`,
    days: p.quotes[0]?.days ?? null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <section className="rounded-3xl bg-brand-50 p-6 sm:p-10">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t("Need something done this week?")}</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
          {t("Product photos, Excel sheets, translations, posters, a POS fix. Post it in two minutes. Providers in Phnom Penh send prices within one working day.")}
        </p>
        <form action="/post-project" method="get" className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="sr-only" htmlFor="home-details">
            {t("What do you need?")}
          </label>
          <input id="home-details" name="details" className={inputClass} placeholder={t("For example: photos of 12 menu items")} />
          <Dropdown name="category" className="sm:w-56" defaultValue="" label={t("Category")} options={[{ value: "", label: t("Choose a category") }, ...categories.map((c) => ({ value: String(c.id), label: categoryLabel(c, locale) }))]} />
          <Button type="submit">{t("Continue")}</Button>
        </form>
        <p className="mt-3 text-sm text-ink-muted">{t("Free to post. You pay the provider directly.")}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">{t("Example projects and prices")}</h2>
        <p className="mt-1 text-ink-muted">{t("Sample prices from the pilot. Yours depends on the scope.")}</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {examples.map((e) => (
            <li key={e.id}>
              <Link href={`/demo/projects/${e.id}`} className="block h-full rounded-2xl border border-stone-200 p-5 transition hover:border-brand-400">
                <p className="font-semibold leading-snug">{e.title}</p>
                <p className="mt-3 text-2xl font-bold">{e.price}</p>
                {e.days !== null && <p className="text-sm text-ink-muted">{e.days === 1 ? t("Delivery in 1 day") : t("Delivery in {n} days", { n: e.days })}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">{t("How it works")}</h2>
        <ol className="mt-5 grid gap-5 sm:grid-cols-3">
          {[
            [t("Send a request"), t("Describe the work in Khmer or English. No account needed.")],
            [t("We match you"), t("Within one working day we suggest two or three suitable providers with prices.")],
            [t("Work gets done"), t("You pay the provider directly. We record the completed job so you can hire the same person again.")],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold">{i + 1}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12">
        <TrustBlock t={t} />
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">{t("Launch categories")}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {launch.map((c) => (
            <li key={c.id} className="rounded-full border border-stone-300 px-4 py-2">
              {categoryLabel(c, locale)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-ink-muted">{t("More categories open after the pilot.")}</p>
      </section>

      <section className="mt-12 rounded-2xl border border-brand-300 p-6">
        <h2 className="text-xl font-bold">{t("Are you a freelancer?")}</h2>
        <p className="mt-2 text-ink-muted">{t("Get clearly scoped, paid projects. Build a record of completed work.")}</p>
        <Link href="/join" className="mt-4 inline-block">
          <Button type="button" variant="secondary">
            {t("Join as a provider")}
          </Button>
        </Link>
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
