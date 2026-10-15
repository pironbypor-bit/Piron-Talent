import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileImage, FileText } from "lucide-react";
import { Notice, Pill } from "@/components/ui";
import { deleteCompanyDocument, setDocumentLevel } from "@/lib/app/actions";
import { companyDocuments, getBusiness } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { CompanyDoc } from "@/lib/app/types";
import { DocumentUploader } from "./uploader";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Documents") };
}

const LEVEL = {
  private: { label: "Private", hint: "Owner and managers", tone: "neutral" },
  team: { label: "Team", hint: "Everyone in the company", tone: "amber" },
  public: { label: "Public", hint: "Anyone, no login", tone: "green" },
} as const;

const size = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const chip = "rounded-xl border px-2 py-1.5 text-xs font-medium";
const on = "border-ink bg-ink text-white";
const off = "border-stone-300 bg-white";

/** Company files. Owner and managers see everything and add files; members see what was shared with the team or the public. */
export default async function CompanyDocumentsPage({ params, searchParams }: Props) {
  const [{ id }, { error }, t, locale] = await Promise.all([params, searchParams, getT(), getLocale()]);
  const b = await getBusiness(id);
  if (!b) notFound();
  const docs = await companyDocuments(id);
  const isOwner = b.role === "owner";
  const manager = isOwner || b.role === "manager";
  const count = (l: CompanyDoc["level"]) => docs.filter((d) => d.level === l).length;

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href={`/app/profile/companies/${b.id}`} className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{t("Documents")}</h1>
            <p className="text-sm text-ink-muted">
              {b.name} · {manager ? t("{a} public · {b} team · {c} private", { a: count("public"), b: count("team"), c: count("private") }) : t("Files the company shared with you.")}
            </p>
          </div>
          {manager && <DocumentUploader businessId={b.id} />}
        </div>
        {manager && <p className="mt-2 text-xs text-ink-muted">{t("New files start as Private. PDF and images, up to 5 MB.")}</p>}
      </section>

      {error && <div className="mt-3"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}
      {manager && !b.page_public && count("public") > 0 && (
        <div className="mt-3"><Notice tone="info">{t("The company page is off, so Public files are not visible to visitors yet.")}</Notice></div>
      )}

      {docs.length === 0 ? (
        <p className="card mt-3 p-4 text-sm text-ink-muted">{t("No files yet.")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {docs.map((d) => {
            const Icon = d.mime === "application/pdf" ? FileText : FileImage;
            const L = LEVEL[d.level];
            return (
              <li key={d.id} className="card p-3">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <a href={`/api/company-file/${d.id}`} target="_blank" rel="noreferrer" className="block truncate font-medium hover:underline">{d.name}</a>
                    <p className="text-xs text-ink-muted">{size(d.bytes)} · {t("Updated {date}", { date: formatDate(d.updated_at, locale) })}</p>
                  </div>
                  <Pill tone={L.tone}>{t(L.label)}</Pill>
                </div>
                {manager && (
                  <div className="mt-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <form action={setDocumentLevel.bind(null, b.id, d.id, "private")}>
                        <button type="submit" disabled={d.level === "private"} className={`${chip} ${d.level === "private" ? on : off}`}>{t("Private")}</button>
                      </form>
                      <form action={setDocumentLevel.bind(null, b.id, d.id, "team")}>
                        <button type="submit" disabled={d.level === "team"} className={`${chip} ${d.level === "team" ? on : off}`}>{t("Team")}</button>
                      </form>
                      {d.level === "public" ? (
                        <span className={`${chip} ${on}`}>{t("Public")}</span>
                      ) : isOwner ? (
                        <details>
                          <summary className={`${chip} ${off} cursor-pointer list-none`}>{t("Public")}</summary>
                          <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                            <p className="font-semibold">{t("Make this file public?")}</p>
                            <p className="mt-1">{t("Anyone who opens your company page can read it, even without an account. Do not publish ID numbers, bank details or private information.")}</p>
                            <form action={setDocumentLevel.bind(null, b.id, d.id, "public")} className="mt-2">
                              <button type="submit" className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">{t("Publish")}</button>
                            </form>
                          </div>
                        </details>
                      ) : (
                        <span className={`${chip} border-stone-200 text-ink-muted opacity-60`}>{t("Public")}</span>
                      )}
                      <form action={deleteCompanyDocument.bind(null, b.id, d.id)} className="ml-auto">
                        <button type="submit" className="text-xs underline">{t("Delete")}</button>
                      </form>
                    </div>
                    <p className="mt-1.5 text-xs text-ink-muted">{t(L.hint)}{!isOwner && ` · ${t("Only the owner can make a file public.")}`}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
