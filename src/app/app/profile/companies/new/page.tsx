import type { Metadata } from "next";
import Link from "next/link";
import { Button, Field, Notice, PageTitle, inputClass } from "@/components/ui";
import { createCompany } from "@/lib/app/actions";
import { CITIES } from "@/lib/cities";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Add company") };
}

/** Three fields. The company then has its own jobs and projects, posted from its page. */
export default async function NewCompanyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [t, { error }] = await Promise.all([getT(), searchParams]);
  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/profile" className="text-sm font-medium underline">{t("Back")}</Link>
      <div className="mt-3">
        <PageTitle lead={t("You can add more companies later. Each one has its own jobs, projects and team.")}>{t("Add company")}</PageTitle>
      </div>
      {error && <div className="mb-4"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}
      <form action={createCompany} className="card space-y-4 p-4">
        <Field label={t("Company name")}>
          <input name="name" required minLength={2} maxLength={80} className={inputClass} placeholder="Sophea Café" />
        </Field>
        <Field label={t("Kind of business")} optional={t("optional")}>
          <input name="kind" maxLength={80} className={inputClass} placeholder={t("Café, shop, studio…")} />
        </Field>
        <Field label={t("City")}>
          <select name="city" defaultValue="Phnom Penh" className={inputClass}>
            <option value="">{t("All provinces and cities")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{t(c)}</option>)}
          </select>
        </Field>
        <Button type="submit">{t("Create company")}</Button>
      </form>
    </main>
  );
}
