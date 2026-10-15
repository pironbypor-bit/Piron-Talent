import type { Metadata } from "next";
import Link from "next/link";
import { Button, Field, Notice, PageTitle, inputClass } from "@/components/ui";
import { createActivity } from "@/lib/app/actions";
import { CITIES } from "@/lib/cities";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Organise an activity") };
}

/** One form. The date and times are in Phnom Penh time; an end before the start means it runs past midnight. */
export default async function NewActivityPage({ searchParams }: { searchParams: Promise<{ error?: string; business?: string }> }) {
  const [t, { error, business }] = await Promise.all([getT(), searchParams]);
  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/activities" className="text-sm font-medium underline">{t("Back")}</Link>
      <div className="mt-3">
        <PageTitle lead={t("Volunteers get a group chat once they join. You confirm who came, and their hours go on their profile.")}>{t("Organise an activity")}</PageTitle>
      </div>
      {error === "limit" && <div className="mb-4"><Notice tone="error">{t("You already have five open activities. Finish or cancel one first.")}</Notice></div>}
      {error === "1" && <div className="mb-4"><Notice tone="error">{t("Please check the highlighted fields.")}</Notice></div>}
      <form action={createActivity} className="card space-y-4 p-4">
        {business && /^[0-9a-f-]{36}$/i.test(business) && <input type="hidden" name="business" value={business} />}
        <Field label={t("Title")}><input name="title" required minLength={3} maxLength={120} className={inputClass} /></Field>
        <Field label={t("What will people do?")}><textarea name="description" required minLength={10} maxLength={3000} rows={5} className={inputClass} /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label={t("Date")}><input type="date" name="date" required className={inputClass} /></Field>
          <Field label={t("Start")}><input type="time" name="start" required defaultValue="08:00" className={inputClass} /></Field>
          <Field label={t("End")}><input type="time" name="end" required defaultValue="11:00" className={inputClass} /></Field>
        </div>
        <Field label={t("Place")} optional={t("optional")}><input name="place" maxLength={120} className={inputClass} /></Field>
        <Field label={t("Province or city")}>
          <select name="city" defaultValue="Phnom Penh" className={inputClass}>
            <option value="">{t("All provinces and cities")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
          </select>
        </Field>
        <Field label={t("People needed")}><input name="capacity" type="number" min={1} max={100} defaultValue={10} required className={inputClass} /></Field>
        <Field label={t("What to bring")} optional={t("optional")}><input name="bring" maxLength={500} className={inputClass} /></Field>
        <Button type="submit">{t("Create activity")}</Button>
      </form>
    </main>
  );
}
