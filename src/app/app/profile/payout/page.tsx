import type { Metadata } from "next";
import Link from "next/link";
import { Button, Field, Notice, Pill, inputClass } from "@/components/ui";
import { savePayoutAccount } from "@/lib/app/actions";
import { getMe, myPayoutAccount } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";

type Props = { searchParams: Promise<{ saved?: string; error?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Payout account") };
}

const METHOD: Record<string, string> = { aba: "ABA", wing: "Wing", bank: "Other bank" };
const TONE = { pending: "amber", approved: "green", rejected: "red" } as const;
const LABEL = { pending: "Waiting for review", approved: "Approved", rejected: "Not approved" } as const;

/** Where the person would like to be paid. The Piron team checks the account holder name against the ID. No money is handled here. */
export default async function PayoutPage({ searchParams }: Props) {
  const [{ saved, error }, t, me, acc] = await Promise.all([searchParams, getT(), getMe(), myPayoutAccount()]);
  if (!me) return null;
  const masked = acc ? `•••• ${acc.account_number.slice(-4)}` : "";

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/profile" className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <h1 className="text-xl font-bold">{t("Payout account")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("Tell us where you want to be paid. The Piron Work team checks that the account holder name is the same as the name on your ID. Piron Work does not move money; this is how customers can see you are verified.")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Pill tone={me.identity_checked ? "green" : "amber"}>{me.identity_checked ? t("Identity checked") : t("Identity not checked yet")}</Pill>
          {acc && <Pill tone={TONE[acc.status]}>{t(LABEL[acc.status])}</Pill>}
        </div>
        {!me.identity_checked && <p className="mt-2 text-sm text-ink-muted"><Link href="/app/profile/identity" className="underline">{t("Do the identity check first.")}</Link></p>}
      </section>

      {saved === "1" && <div className="mt-3"><Notice tone="success">{t("Saved. The team will check the name.")}</Notice></div>}
      {error && <div className="mt-3"><Notice tone="error">{t("Please check the highlighted fields.")}</Notice></div>}
      {acc?.status === "rejected" && acc.note && <div className="mt-3"><Notice tone="error">{acc.note}</Notice></div>}

      {acc && (
        <section className="card mt-3 p-4 text-sm">
          <p className="font-medium">{t(METHOD[acc.method])} · {masked}</p>
          <p className="text-ink-muted">{acc.account_name}</p>
        </section>
      )}

      <form action={savePayoutAccount} className="card mt-3 space-y-4 p-4">
        <h2 className="font-semibold">{acc ? t("Change the account") : t("Add an account")}</h2>
        <Field label={t("Account type")}>
          <select name="method" defaultValue={acc?.method ?? "aba"} className={inputClass}>
            <option value="aba">ABA</option>
            <option value="wing">Wing</option>
            <option value="bank">{t("Other bank")}</option>
          </select>
        </Field>
        <Field label={t("Account holder name")} hint={t("Exactly as on your ID.")}><input name="account_name" required minLength={2} maxLength={100} defaultValue={acc?.account_name ?? ""} className={inputClass} /></Field>
        <Field label={t("Account number or phone")}><input name="account_number" required minLength={3} maxLength={40} className={inputClass} autoComplete="off" /></Field>
        <Button type="submit">{t("Save for review")}</Button>
        <p className="text-xs text-ink-muted">{t("Only you and the Piron Work team can see this. Changing it sends it for review again.")}</p>
      </form>
    </main>
  );
}
