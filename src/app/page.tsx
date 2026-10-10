import Link from "next/link";
import { APP_NAME, TAGLINE } from "@/lib/brand";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  const t = await getT();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-16">
      <p className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800">
        <span className="size-2 rounded-full bg-brand-500" />
        {t("Coming 2027. Phnom Penh first.")}
      </p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{APP_NAME}</h1>
      <p className="mt-3 text-2xl text-ink-muted">{t(TAGLINE)}</p>
      <p className="mt-6 max-w-xl text-lg leading-relaxed">
        {t("Post a clearly scoped project, compare quotes from verified providers, and hire again the people you trust.")}
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/signup?as=customer" className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-ink hover:bg-brand-400">
          {t("Post a project")}
        </Link>
        <Link href="/signup?as=provider" className="rounded-xl border border-brand-300 px-5 py-3 font-semibold hover:bg-brand-50">
          {t("Join as a provider")}
        </Link>
      </div>
    </main>
  );
}
