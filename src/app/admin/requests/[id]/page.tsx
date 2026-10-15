import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Field, Notice, PageTitle, Pill, inputClass } from "@/components/ui";
import { categoryLabel, getCategories } from "@/lib/categories";
import { getLocale, getT } from "@/lib/i18n/server";
import {
  JOB_STATUSES,
  REQUEST_STATUSES,
  formatBudget,
  formatDate,
  statusLabel,
  statusTone,
  type PilotJob,
  type ProjectRequest,
  type ProviderApplication,
} from "@/lib/pilot";
import { matchRequest, setJobStatus, setRequestStatus } from "../../actions";
import { requireAdmin } from "../../guard";
import { Dropdown } from "@/components/dropdown";

export const metadata: Metadata = { title: "Admin" };

type Params = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function AdminRequestPage({ params, searchParams }: Params) {
  const [t, locale, { supabase, isAdmin }, categories, { id }, { error }] = await Promise.all([
    getT(),
    getLocale(),
    requireAdmin(),
    getCategories(),
    params,
    searchParams,
  ]);
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">{t("Not allowed.")}</Notice>
      </main>
    );
  }
  const [{ data: request }, { data: jobs }, { data: providers }] = await Promise.all([
    supabase.from("project_requests").select("*").eq("id", id).maybeSingle(),
    supabase.from("pilot_jobs").select("*").eq("request_id", id).order("created_at", { ascending: false }),
    supabase.from("provider_applications").select("*").in("status", ["new", "contacted", "approved"]).order("full_name"),
  ]);
  if (!request) notFound();
  const r = request as ProjectRequest;
  const providerList = (providers ?? []) as ProviderApplication[];
  const category = (cid: number | null) => {
    const c = categories.find((x) => x.id === cid);
    return c ? categoryLabel(c, locale) : null;
  };
  const row = (label: string, value: string | null) =>
    value ? (
      <div className="grid grid-cols-3 gap-2 py-2">
        <dt className="text-sm text-ink-muted">{label}</dt>
        <dd className="col-span-2 whitespace-pre-wrap">{value}</dd>
      </div>
    ) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-6">
        <Link href="/admin" className="text-sm font-medium underline">
          {t("Back")}
        </Link>
      </p>
      <PageTitle lead={`${formatDate(r.created_at, locale)} · ${statusLabel(t, r.status)}`}>
        {r.contact_name}
        {r.business_name ? ` · ${r.business_name}` : ""}
      </PageTitle>
      {error && <div className="mb-6"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}

      <dl className="divide-y divide-stone-200 rounded-xl border border-stone-200 px-4">
        {row(t("Contact"), r.contact)}
        {row(t("Category"), category(r.category_id))}
        {row(t("Details"), r.details)}
        {row(t("Budget"), formatBudget(r.budget_min, r.budget_max))}
        {row(t("Needed by"), r.needed_by)}
        {row(t("Admin note"), r.admin_note)}
      </dl>

      <form action={setRequestStatus} className="mt-6 flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={r.id} />
        <Field label={t("Status")}>
          <Dropdown name="status" defaultValue={r.status} options={REQUEST_STATUSES.map((s) => ({ value: s, label: statusLabel(t, s) }))} />
        </Field>
        <Field label={t("Admin note")}>
          <input name="note" className={`${inputClass} w-72`} />
        </Field>
        <Button variant="secondary" type="submit">
          {t("Save")}
        </Button>
      </form>

      <section className="mt-12">
        <h2 className="text-xl font-bold">{t("Jobs")}</h2>
        {!jobs?.length && <p className="mt-2 text-ink-muted">{t("Nothing yet.")}</p>}
        <ul className="mt-3 space-y-3">
          {(jobs as PilotJob[] | null)?.map((j) => {
            const p = providerList.find((x) => x.id === j.application_id);
            return (
              <li key={j.id} className="rounded-xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{p ? `${p.full_name} · ${p.contact}` : t("Provider")}</p>
                    <p className="text-sm text-ink-muted">
                      {formatDate(j.created_at, locale)}
                      {j.agreed_price !== null ? ` · $${j.agreed_price}` : ""}
                      {j.completed_at ? ` · ${t("Completed")} ${formatDate(j.completed_at, locale)}` : ""}
                    </p>
                    {j.note && <p className="mt-1 text-sm">{j.note}</p>}
                  </div>
                  <Pill tone={statusTone(j.status)}>{statusLabel(t, j.status)}</Pill>
                </div>
                <form action={setJobStatus} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={j.id} />
                  <input type="hidden" name="request_id" value={r.id} />
                  <Dropdown small className="w-auto" name="status" defaultValue={j.status} label={t("Status")} options={JOB_STATUSES.map((s) => ({ value: s, label: statusLabel(t, s) }))} />
                  <input name="price" inputMode="decimal" placeholder={t("Agreed price (USD)")} className={`${inputClass} w-44 py-1.5 text-sm`} />
                  <input name="note" placeholder={t("Note")} className={`${inputClass} w-56 py-1.5 text-sm`} />
                  <Button variant="secondary" type="submit" className="px-3 py-1.5 text-sm">
                    {t("Save")}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">{t("Match with a provider")}</h2>
        <form action={matchRequest} className="mt-4 space-y-4">
          <input type="hidden" name="request_id" value={r.id} />
          <Field label={t("Provider")}>
            <Dropdown required name="application_id" defaultValue="" options={[{ value: "", label: t("Choose a provider") }, ...providerList.map((p) => ({ value: p.id, label: `${p.full_name} · ${category(p.category_id) ?? p.skills.slice(0, 40)} · ${statusLabel(t, p.status)}` }))]} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("Agreed price (USD)")} optional={t("optional")}>
              <input name="price" inputMode="decimal" className={inputClass} />
            </Field>
            <Field label={t("Note")} optional={t("optional")}>
              <input name="note" className={inputClass} />
            </Field>
          </div>
          <Button type="submit">{t("Create job")}</Button>
        </form>
      </section>
    </main>
  );
}
