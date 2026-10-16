import type { Metadata } from "next";
import Link from "next/link";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { Dropdown } from "@/components/dropdown";
import { resetMyCard, saveMyCard } from "@/lib/app/actions";
import { requireFeature } from "@/lib/app/features";
import { getMe, getMyCard } from "@/lib/app/queries";
import { resolveCard } from "@/lib/app/cards";
import { CITIES } from "@/lib/cities";
import { getT } from "@/lib/i18n/server";
import { ProCard } from "../../professionals/pro-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("My card") };
}

/** The person's card for the Professionals page. Made from the profile; anything typed here replaces the profile value. */
export default async function MyCardPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireFeature("home_pages");
  const [t, me, mine, { saved, error }] = await Promise.all([getT(), getMe(), getMyCard(), searchParams]);
  if (!me) return null; // the proxy sends visitors to /login
  const profileCard = resolveCard({ ...me, skills: me.skills, card: null });
  const shown = resolveCard({ ...me, skills: me.skills, card: mine });
  const state = !me.is_available ? "hidden" : shown.complete ? "published" : "needs";
  const miss: Record<string, string> = { services: t("a services line"), city: t("a city"), price: t("a price from") };

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/professionals" className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <h1 className="text-xl font-bold">{t("My card")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("This is how you appear in Professionals. It is made from your profile. Change a line here and your change is used instead.")}</p>
        <p className="mt-2 text-sm">
          <b>{state === "published" ? t("Published") : state === "needs" ? t("Needs details") : t("Hidden")}</b>
          {state === "needs" && <span className="text-ink-muted"> · {t("Add {things} to appear.", { things: shown.missing.map((m) => miss[m]).join(", ") })}</span>}
        </p>
      </section>

      {saved === "1" && <div className="mt-3"><Notice tone="success">{t("Saved.")}</Notice></div>}
      {error && <div className="mt-3"><Notice tone="error">{t("Please check the highlighted fields.")}</Notice></div>}

      <div className="mt-3 max-w-[260px]">
        <ProCard id={me.id} card={shown} avatarUrl={me.avatar_url} checked={me.identity_checked} availableUntil={me.available_until} rating={null} reviews={0} t={t} preview />
      </div>

      <form action={saveMyCard} className="card mt-3 space-y-4 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="published" defaultChecked={me.is_available} />
          {t("Published (shown to everyone)")}
        </label>
        <Field label={t("Name on the card")} hint={t("Empty = your profile name: {v}", { v: profileCard.name })} optional={t("optional")}>
          <input name="title" maxLength={60} defaultValue={mine?.title ?? ""} className={inputClass} />
        </Field>
        <Field label={t("Services line")} hint={t("Empty = from your skills: {v}", { v: profileCard.services || "-" })} optional={t("optional")}>
          <input name="services" maxLength={100} defaultValue={mine?.services ?? ""} placeholder="Home wiring · Lighting · Fans" className={inputClass} />
        </Field>
        <Field label={t("Price from")} hint={t("Empty = from your profile: {v}", { v: profileCard.price || "-" })} optional={t("optional")}>
          <input name="price_from" maxLength={40} defaultValue={mine?.price_from ?? ""} placeholder="$15 / hour" className={inputClass} />
        </Field>
        <Field label={t("City")} optional={t("optional")}>
          <Dropdown name="city" defaultValue={mine?.city ?? ""} options={[{ value: "", label: `${t("Same as profile")}: ${profileCard.city ? t(profileCard.city) : "-"}` }, ...CITIES.map((c) => ({ value: c, label: t(c) }))]} />
        </Field>
        <Field label={t("Short description")} optional={t("optional")}>
          <textarea name="about" maxLength={280} rows={3} defaultValue={mine?.about ?? ""} className={inputClass} />
        </Field>
        <Button type="submit">{t("Save card")}</Button>
      </form>

      <form action={resetMyCard} className="mt-3">
        <button type="submit" className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-50">{t("Use profile details again")}</button>
      </form>
    </main>
  );
}
