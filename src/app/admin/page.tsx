import type { Metadata } from "next";
import Link from "next/link";
import { Button, Notice, PageTitle, Pill, inputClass } from "@/components/ui";
import { categoryLabel, getCategories } from "@/lib/categories";
import { getLocale, getT } from "@/lib/i18n/server";
import { APPLICANT_STATUSES, formatDate, statusLabel, statusTone, type ProjectRequest, type ProviderApplication } from "@/lib/pilot";
import { setApplicationStatus } from "./actions";
import { requireAdmin } from "./guard";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [t, locale, { supabase, isAdmin }, categories, { error }] = await Promise.all([getT(), getLocale(), requireAdmin(), getCategories(), searchParams]);
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">{t("Not allowed.")}</Notice>
      </main>
    );
  }
  const [{ data: requests }, { data: applications }, { count: completed }] = await Promise.all([
    supabase.from("project_requests").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("provider_applications").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("pilot_jobs").select("id", { count: "exact", head: true }).eq("status", "completed"),
  ]);
  const category = (id: number | null) => {
    const c = categories.find((x) => x.id === id);
    return c ? categoryLabel(c, locale) : null;
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <PageTitle lead={t("Completed jobs: {n}", { n: completed ?? 0 })}>Admin</PageTitle>
      {error && <div className="mb-6"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}
      <p className="mb-8 flex flex-wrap gap-4">
        <Link href="/admin/identity" className="font-medium underline">{t("Identity review")}</Link>
        <Link href="/admin/reports" className="font-medium underline">{t("Reports")}</Link>
        <Link href="/admin/disputes" className="font-medium underline">{t("Disputes")}</Link>
      </p>

      <section className="mb-12">
        <h2 className="text-xl font-bold">{t("Project requests")}</h2>
        {!requests?.length && <p className="mt-2 text-ink-muted">{t("Nothing yet.")}</p>}
        <ul className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200">
          {(requests as ProjectRequest[] | null)?.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/admin/requests/${r.id}`} className="font-semibold underline">
                    {r.contact_name}
                    {r.business_name ? ` · ${r.business_name}` : ""}
                  </Link>
                  <p className="text-sm text-ink-muted">
                    {formatDate(r.created_at, locale)}
                    {category(r.category_id) ? ` · ${category(r.category_id)}` : ""} · {r.contact}
                    {r.source ? ` · ${t("from")} ${r.source}` : ""}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm">{r.details}</p>
                </div>
                <Pill tone={statusTone(r.status)}>{statusLabel(t, r.status)}</Pill>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold">{t("Provider applications")}</h2>
        {!applications?.length && <p className="mt-2 text-ink-muted">{t("Nothing yet.")}</p>}
        <ul className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200">
          {(applications as ProviderApplication[] | null)?.map((a) => (
            <li key={a.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {a.full_name} <span className="font-normal text-ink-muted">· {a.city}</span>
                  </p>
                  <p className="text-sm text-ink-muted">
                    {formatDate(a.created_at, locale)}
                    {category(a.category_id) ? ` · ${category(a.category_id)}` : ""} · {a.contact}
                    {a.experience_years !== null ? ` · ${t("{n} years", { n: a.experience_years })}` : ""}
                    {a.source ? ` · ${t("from")} ${a.source}` : ""}
                  </p>
                  <p className="mt-1 text-sm">{a.skills}</p>
                  {a.portfolio_url && (
                    <a href={/^https?:/i.test(a.portfolio_url) ? a.portfolio_url : `https://${a.portfolio_url}`} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                      {t("Link to past work")}
                    </a>
                  )}
                  {a.admin_note && <p className="mt-1 text-sm text-ink-muted">{t("Admin note")}: {a.admin_note}</p>}
                </div>
                <Pill tone={statusTone(a.status)}>{statusLabel(t, a.status)}</Pill>
              </div>
              <form action={setApplicationStatus} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={a.id} />
                <select name="status" defaultValue={a.status} className={`${inputClass} w-auto py-1.5 text-sm`} aria-label={t("Status")}>
                  {APPLICANT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(t, s)}
                    </option>
                  ))}
                </select>
                <input name="note" placeholder={t("Note")} className={`${inputClass} w-64 py-1.5 text-sm`} />
                <Button variant="secondary" type="submit" className="px-3 py-1.5 text-sm">
                  {t("Save")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
