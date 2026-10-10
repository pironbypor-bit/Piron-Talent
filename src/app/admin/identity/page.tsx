import type { Metadata } from "next";
import Link from "next/link";
import { Button, Notice, PageTitle, Pill, inputClass } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { requireAdmin } from "../guard";
import { reviewIdentity } from "./actions";

/* eslint-disable @next/next/no-img-element */

export const metadata: Metadata = { title: "Admin" };

type Row = { id: string; user_id: string; image_path: string; selfie_path: string | null; legal_name: string | null; id_type: string | null; id_number: string | null; date_of_birth: string | null; status: string; note: string | null; created_at: string; profiles: { display_name: string } | { display_name: string }[] | null };

/** Identity review queue: the photo (signed link, one hour), the name, approve or reject with a note. */
export default async function IdentityReviewPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [t, locale, { supabase, isAdmin }, { error }] = await Promise.all([getT(), getLocale(), requireAdmin(), searchParams]);
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Notice tone="error">{t("Not allowed.")}</Notice>
      </main>
    );
  }
  const { data } = await supabase.from("identity_checks").select("id,user_id,image_path,selfie_path,legal_name,id_type,id_number,date_of_birth,status,note,created_at,profiles!identity_checks_user_id_fkey(display_name)").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as Row[];
  const pending = rows.filter((r) => r.status === "pending");
  const signed = await Promise.all(pending.map((r) => supabase.storage.from("identity").createSignedUrl(r.image_path, 3600)));
  const signedSelfie = await Promise.all(pending.map((r) => (r.selfie_path ? supabase.storage.from("identity").createSignedUrl(r.selfie_path, 3600) : Promise.resolve({ data: null }))));
  const ID_TYPE: Record<string, string> = { national_id: "National ID card", passport: "Passport", other: "Other" };
  const name = (r: Row) => (Array.isArray(r.profiles) ? r.profiles[0]?.display_name : r.profiles?.display_name) ?? r.user_id;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-6">
        <Link href="/admin" className="text-sm font-medium underline">
          {t("Back")}
        </Link>
      </p>
      <PageTitle lead={`${pending.length} ${t("Pending").toLowerCase()}`}>{t("Identity review")}</PageTitle>
      {error && <div className="mb-6"><Notice tone="error">{t("Something went wrong. Please try again.")}</Notice></div>}

      <ul className="space-y-4">
        {pending.map((r, i) => (
          <li key={r.id} className="rounded-xl border border-stone-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{name(r)}</p>
                <p className="text-sm text-ink-muted">{formatDate(r.created_at, locale)}</p>
              </div>
              <Pill tone="amber">{t("Pending")}</Pill>
            </div>
            {(r.legal_name || r.id_number) && (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-stone-50 p-3 text-sm">
                <dt className="text-ink-muted">{t("Legal name")}</dt><dd>{r.legal_name ?? "-"}</dd>
                <dt className="text-ink-muted">{t("ID type")}</dt><dd>{r.id_type ? t(ID_TYPE[r.id_type] ?? r.id_type) : "-"}</dd>
                <dt className="text-ink-muted">{t("ID number")}</dt><dd>{r.id_number ?? "-"}</dd>
                <dt className="text-ink-muted">{t("Date of birth")}</dt><dd>{r.date_of_birth ?? "-"}</dd>
              </dl>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {signed[i]?.data?.signedUrl && (
                <figure>
                  <img src={signed[i].data!.signedUrl} alt="" className="max-h-80 w-full rounded-lg border border-stone-200 object-contain" />
                  <figcaption className="mt-1 text-xs text-ink-muted">{t("ID front")}</figcaption>
                </figure>
              )}
              {signedSelfie[i]?.data?.signedUrl && (
                <figure>
                  <img src={signedSelfie[i].data!.signedUrl} alt="" className="max-h-80 w-full rounded-lg border border-stone-200 object-contain" />
                  <figcaption className="mt-1 text-xs text-ink-muted">{t("Selfie")}</figcaption>
                </figure>
              )}
            </div>
            <form action={reviewIdentity} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input name="note" placeholder={t("Note")} className={`${inputClass} w-64 py-1.5 text-sm`} />
              <Button type="submit" name="status" value="checked" className="px-3 py-1.5 text-sm">
                {t("Approve")}
              </Button>
              <Button type="submit" name="status" value="rejected" variant="secondary" className="px-3 py-1.5 text-sm">
                {t("Reject")}
              </Button>
            </form>
          </li>
        ))}
        {pending.length === 0 && <li className="text-ink-muted">{t("Nothing yet.")}</li>}
      </ul>

      {rows.length > pending.length && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("Completed")}</h2>
          <ul className="mt-2 divide-y divide-stone-200 rounded-xl border border-stone-200">
            {rows.filter((r) => r.status !== "pending").map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
                <span>
                  {name(r)} · {formatDate(r.created_at, locale)}
                  {r.note ? ` · ${r.note}` : ""}
                </span>
                <Pill tone={r.status === "checked" ? "green" : "red"}>{r.status === "checked" ? t("Checked") : t("Rejected")}</Pill>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
