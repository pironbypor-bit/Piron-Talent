import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Globe, LogOut, Shield, UserPen } from "lucide-react";
import { Button } from "@/components/ui";
import { getMe, isAdmin } from "@/lib/app/queries";
import { ALL_LANGUAGES } from "@/lib/i18n/core";
import { getLocale, getT } from "@/lib/i18n/server";
import { logOut } from "@/app/auth/actions";
import { setLocale } from "@/app/actions/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Settings") };
}

/** Settings behind the gear on the profile tab: edit profile, language, admin tools, log out. */
export default async function SettingsPage() {
  const [t, locale, me, admin] = await Promise.all([getT(), getLocale(), getMe(), isAdmin()]);
  if (!me) return null;
  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/profile" className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{t("Settings")}</h1>

      <section className="card mt-4 divide-y divide-stone-100">
        <Link href="/app/profile/edit" className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
            <UserPen className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t("Edit profile")}</span>
            <span className="block text-sm text-ink-muted">{t("Name, role, skills, availability")}</span>
          </span>
          <ChevronRight className="size-4 text-ink-muted" />
        </Link>
        {admin && (
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
              <Shield className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t("Admin tools")}</span>
              <span className="block text-sm text-ink-muted">{t("Requests, identity review")}</span>
            </span>
            <ChevronRight className="size-4 text-ink-muted" />
          </Link>
        )}
      </section>

      <section className="card mt-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
            <Globe className="size-4" />
          </span>
          <span className="flex-1 font-semibold">{t("Language")}</span>
          <form action={setLocale} className="flex overflow-hidden rounded-lg border border-stone-300">
            {ALL_LANGUAGES.map((l) => (
              <button key={l} type="submit" name="lang" value={l} aria-pressed={locale === l} className={`px-3 py-1.5 text-sm font-medium ${locale === l ? "bg-ink text-white" : "bg-white"}`}>
                {l === "km" ? "ខ្មែរ" : "EN"}
              </button>
            ))}
          </form>
        </div>
      </section>

      <section className="card mt-4 px-4 py-3">
        <p className="text-sm text-ink-muted">{t("Signed in as {email}", { email: me.display_name })}</p>
        <form action={logOut} className="mt-2">
          <Button type="submit" variant="secondary" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm">
            <LogOut className="size-4" /> {t("Log out")}
          </Button>
        </form>
      </section>
    </main>
  );
}
