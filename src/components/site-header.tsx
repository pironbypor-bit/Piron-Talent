import Link from "next/link";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/brand";
import { ALL_LANGUAGES } from "@/lib/i18n/core";
import { getLocale, getT } from "@/lib/i18n/server";
import { getUserId } from "@/lib/supabase/server";
import { setLocale } from "@/app/actions/locale";

const LANGUAGE_LABEL = { km: "ខ្មែរ", en: "EN" } as const;

export async function SiteHeader() {
  const [t, locale, userId] = await Promise.all([getT(), getLocale(), getUserId()]);
  return (
    <header className="border-b border-stone-200">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {APP_NAME}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <form action={setLocale} aria-label={t("Language")} className="flex overflow-hidden rounded-lg border border-stone-300">
            {ALL_LANGUAGES.map((l) => (
              <button
                key={l}
                type="submit"
                name="lang"
                value={l}
                aria-pressed={locale === l}
                className={`px-2.5 py-1 font-medium ${locale === l ? "bg-ink text-white" : "hover:bg-stone-100"}`}
              >
                {LANGUAGE_LABEL[l]}
              </button>
            ))}
          </form>
          <Link href="/app" className="font-medium hover:underline">
            {t("Open the app")}
          </Link>
          {userId ? (
            <Link href="/dashboard" className="font-medium hover:underline">
              {t("Your account")}
            </Link>
          ) : (
            <Link href="/login" className="font-medium hover:underline">
              {t("Log in")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const t = await getT();
  return (
    <footer className="mt-16 border-t border-stone-200">
      <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-ink-muted">
        {t("Piron Talent is run from Phnom Penh. Questions: {email}", { email: CONTACT_EMAIL })}
      </p>
    </footer>
  );
}
