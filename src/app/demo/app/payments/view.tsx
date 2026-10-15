"use client";

import { useState } from "react";
import { Camera, Check, CreditCard, FileText, Landmark, Lock, QrCode, ShieldCheck, Wallet } from "lucide-react";
import { Notice, Pill } from "@/components/ui";
import { useT } from "@/lib/i18n/client";

// Demo of real payments and identity check level 3. Nothing here is built. Numbers are examples only.
// State lives in this component; reload and everything goes back to the start.

type Tab = "pay" | "payout" | "verify" | "receipt";
type Pay = "unpaid" | "held" | "released" | "problem";
type Method = "card" | "aba" | "wing" | "khqr";

const PRICE = 45;
const PIRON_FEE = 0.05; // example only
const PARTNER_FEE = 0.02; // example only
const fee1 = PRICE * PIRON_FEE;
const fee2 = PRICE * PARTNER_FEE;
const NET = PRICE - fee1 - fee2;
const usd = (n: number) => `$${n.toFixed(2)}`;

const METHODS: { key: Method; label: string; hint: string; Icon: typeof CreditCard }[] = [
  { key: "card", label: "Bank card", hint: "Visa or Mastercard", Icon: CreditCard },
  { key: "aba", label: "ABA", hint: "Open your ABA app", Icon: Landmark },
  { key: "wing", label: "Wing", hint: "Open your Wing app", Icon: Wallet },
  { key: "khqr", label: "KHQR", hint: "Scan with any bank app", Icon: QrCode },
];

const TABS: { key: Tab; label: string }[] = [
  { key: "pay", label: "Customer pays" },
  { key: "payout", label: "Provider gets paid" },
  { key: "verify", label: "Verify, level 3" },
  { key: "receipt", label: "Receipt" },
];

export function PaymentsDemo() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("pay");
  const [pay, setPay] = useState<Pay>("unpaid");
  const [method, setMethod] = useState<Method>("aba");
  const [paidOut, setPaidOut] = useState(false);
  const [payoutTo, setPayoutTo] = useState<"aba" | "wing" | "bank">("aba");
  // Level 3 steps: 0 selfie, 1 account, 2 business (optional), 3 submitted, 4 approved
  const [selfie, setSelfie] = useState(false);
  const [account, setAccount] = useState(false);
  const [business, setBusiness] = useState<"todo" | "skipped" | "done">("todo");
  const [review, setReview] = useState<"none" | "submitted" | "approved">("none");
  const verified = review === "approved";
  const ready = selfie && account && business !== "todo";

  const balance = pay === "released" && !paidOut ? NET : 0;
  const held = pay === "held" ? NET : 0;
  const paidTotal = paidOut ? NET : 0;

  const step = (done: boolean, label: string, hint: string, action?: React.ReactNode, optional?: boolean) => (
    <li className="card flex items-start gap-3 p-3">
      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : "bg-stone-200 text-ink"}`}>{done ? <Check className="size-4" /> : ""}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{t(label)}{optional && <span className="ml-1 text-xs font-normal text-ink-muted">({t("optional")})</span>}</p>
        <p className="text-sm text-ink-muted">{t(hint)}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </li>
  );
  const btn = "rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-ink hover:bg-brand-400";
  const ghost = "rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-medium hover:bg-brand-50";

  return (
    <div>
      <h1 className="text-xl font-bold leading-tight">{t("Payments")}</h1>
      <p className="text-sm text-ink-muted">{t("Job: Cafe logo refresh · Dara · {price}", { price: usd(PRICE) })}</p>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((x) => (
          <button key={x.key} type="button" onClick={() => setTab(x.key)} aria-pressed={tab === x.key} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${tab === x.key ? "border-ink bg-ink text-white" : "border-stone-300 bg-white"}`}>{t(x.label)}</button>
        ))}
      </div>
      <div className="mt-3"><Notice tone="info">{t("Demo with sample data. Real payments are not built. No money moves and the fee numbers are examples.")}</Notice></div>

      {tab === "pay" && (
        <div className="mt-3 space-y-3">
          <section className="card p-4">
            <h2 className="font-semibold">{t("Pay for this job")}</h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">{t("Agreed price")}</dt><dd className="font-semibold">{usd(PRICE)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">{t("Added for you")}</dt><dd>{usd(0)}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-1"><dt>{t("You pay")}</dt><dd className="font-bold">{usd(PRICE)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-ink-muted">{t("The money is held safely and is released to the provider only after you confirm the work.")}</p>
          </section>

          {pay === "unpaid" && (
            <section className="card p-4">
              <h3 className="text-sm font-semibold">{t("Pay with")}</h3>
              <div role="radiogroup" className="mt-2 grid grid-cols-2 gap-2">
                {METHODS.map(({ key, label, hint, Icon }) => (
                  <button key={key} type="button" role="radio" aria-checked={method === key} onClick={() => setMethod(key)}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left ${method === key ? "border-ink bg-stone-50" : "border-stone-300"}`}>
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0"><span className="block text-sm font-medium">{t(label)}</span><span className="block text-xs text-ink-muted">{t(hint)}</span></span>
                  </button>
                ))}
              </div>
              {method === "khqr" && <div className="mt-3 flex items-center gap-3 rounded-xl bg-stone-50 p-3"><QrCode className="size-16 text-ink" aria-hidden="true" /><p className="text-sm text-ink-muted">{t("Scan this code with your bank app. Sample code, not real.")}</p></div>}
              <button type="button" onClick={() => setPay("held")} className={`${btn} mt-3 w-full py-2.5`}>{t("Pay {price}", { price: usd(PRICE) })}</button>
            </section>
          )}

          {pay === "held" && (
            <section className="card space-y-3 p-4">
              <Pill tone="amber">{t("Payment held")}</Pill>
              <p className="text-sm">{t("Your {price} is held. Dara has been told to start the work.", { price: usd(PRICE) })}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPay("released")} className={btn}>{t("Work is good, release the payment")}</button>
                <button type="button" onClick={() => setPay("problem")} className={ghost}>{t("There is a problem")}</button>
              </div>
            </section>
          )}
          {pay === "released" && <section className="card p-4"><Pill tone="green">{t("Payment released")}</Pill><p className="mt-2 text-sm">{t("Thank you. {name} will receive the money.", { name: "Dara" })}</p></section>}
          {pay === "problem" && (
            <section className="card space-y-2 p-4">
              <Pill tone="red">{t("Payment on hold")}</Pill>
              <p className="text-sm">{t("The money stays held while the Piron Work team looks at the problem with both of you.")}</p>
              <button type="button" onClick={() => setPay("held")} className={ghost}>{t("Back to held")}</button>
            </section>
          )}
          {pay !== "unpaid" && <button type="button" onClick={() => { setPay("unpaid"); setPaidOut(false); }} className="text-xs underline">{t("Start the demo again")}</button>}
        </div>
      )}

      {tab === "payout" && (
        <div className="mt-3 space-y-3">
          <section className="card p-4">
            <h2 className="font-semibold">{t("Your earnings")}</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-stone-50 p-2"><p className="text-xs text-ink-muted">{t("Held")}</p><p className="font-bold">{usd(held)}</p></div>
              <div className="rounded-xl bg-stone-50 p-2"><p className="text-xs text-ink-muted">{t("Ready to withdraw")}</p><p className="font-bold">{usd(balance)}</p></div>
              <div className="rounded-xl bg-stone-50 p-2"><p className="text-xs text-ink-muted">{t("Paid out")}</p><p className="font-bold">{usd(paidTotal)}</p></div>
            </div>
            <dl className="mt-3 space-y-1 border-t border-stone-200 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">{t("Job price")}</dt><dd>{usd(PRICE)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">{t("Piron Work fee, example 5%")}</dt><dd>- {usd(fee1)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">{t("Payment partner fee, example 2%")}</dt><dd>- {usd(fee2)}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-1 font-semibold"><dt>{t("You receive")}</dt><dd>{usd(NET)}</dd></div>
            </dl>
          </section>

          {!verified ? (
            <section className="card flex items-start gap-3 p-4">
              <Lock className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
              <div>
                <p className="font-semibold">{t("Verify to withdraw")}</p>
                <p className="text-sm text-ink-muted">{t("Before your first payout we check your face against your ID and that the account is yours.")}</p>
                <button type="button" onClick={() => setTab("verify")} className={`${btn} mt-2`}>{t("Start verification")}</button>
              </div>
            </section>
          ) : (
            <section className="card space-y-3 p-4">
              <h3 className="font-semibold">{t("Withdraw")}</h3>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {([["aba", "ABA account"], ["wing", "Wing wallet"], ["bank", "Other bank"]] as const).map(([k, l]) => (
                  <button key={k} type="button" role="radio" aria-checked={payoutTo === k} onClick={() => setPayoutTo(k)} className={`rounded-full border px-3 py-1.5 text-sm ${payoutTo === k ? "border-ink bg-ink text-white" : "border-stone-300 bg-white"}`}>{t(l)}</button>
                ))}
              </div>
              <button type="button" disabled={balance <= 0} onClick={() => setPaidOut(true)} className={`${btn} w-full py-2.5 disabled:opacity-50`}>{balance > 0 ? t("Withdraw {amount}", { amount: usd(balance) }) : paidOut ? t("Paid out") : t("Nothing to withdraw yet")}</button>
              {paidOut && <Notice tone="success">{t("Sent to your account. It usually arrives the same day.")}</Notice>}
            </section>
          )}
        </div>
      )}

      {tab === "verify" && (
        <div className="mt-3 space-y-3">
          <section className="card p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6 shrink-0 text-ink-muted" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">{t("Identity check, level 3")}</h2>
                <p className="text-sm text-ink-muted">{review === "approved" ? t("Verified. You can withdraw money.") : t("Needed once, before your first payout.")}</p>
              </div>
              <span className="ml-auto"><Pill tone={review === "approved" ? "green" : review === "submitted" ? "amber" : "neutral"}>{review === "approved" ? t("Approved") : review === "submitted" ? t("In review") : t("Not finished")}</Pill></span>
            </div>
          </section>

          <ol className="space-y-2">
            {step(true, "ID or passport", "Checked at level 2. Nothing more to do.")}
            {step(selfie, "Live selfie", "Look at the camera and turn your head slowly. We compare your face with your ID photo.",
              !selfie && <button type="button" onClick={() => setSelfie(true)} className={`${btn} inline-flex items-center gap-1.5`}><Camera className="size-4" aria-hidden="true" />{t("Open the camera")}</button>)}
            {step(account, "Your payout account", "Choose where money is sent. The name on the account must match your ID.",
              !account && <button type="button" onClick={() => setAccount(true)} className={btn}>{t("Check my ABA account")}</button>)}
            {step(business !== "todo", "Business registration", "Only if you are paid as a company. Upload the registration paper.",
              business === "todo" && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setBusiness("done")} className={btn}>{t("Upload registration")}</button>
                  <button type="button" onClick={() => setBusiness("skipped")} className={ghost}>{t("I am paid as a person")}</button>
                </div>
              ), true)}
          </ol>

          <section className="card space-y-2 p-4">
            {review === "none" && (
              <>
                <button type="button" disabled={!ready} onClick={() => setReview("submitted")} className={`${btn} w-full py-2.5 disabled:opacity-50`}>{t("Send for review")}</button>
                {!ready && <p className="text-xs text-ink-muted">{t("Finish the steps above first.")}</p>}
              </>
            )}
            {review === "submitted" && (
              <>
                <p className="text-sm">{t("We are checking your details. This usually takes one working day. You will get a notification.")}</p>
                <button type="button" onClick={() => setReview("approved")} className={ghost}>{t("Demo: approve now")}</button>
              </>
            )}
            {review === "approved" && <button type="button" onClick={() => setTab("payout")} className={btn}>{t("Go to withdraw")}</button>}
          </section>
          <p className="px-1 text-xs text-ink-muted">{t("Your photos are used only for this check. Piron Work keeps the result, not the video.")}</p>
        </div>
      )}

      {tab === "receipt" && (
        <div className="mt-3 space-y-3">
          <article className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs uppercase tracking-wide text-ink-muted">{t("Receipt")}</p><h2 className="text-lg font-bold">PW-R-2026-0001</h2></div>
              <FileText className="size-6 text-ink-muted" aria-hidden="true" />
            </div>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">{t("Paid by")}</dt><dd>Sophea Café</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">{t("Paid to")}</dt><dd>Dara</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">{t("For")}</dt><dd>{t("Cafe logo refresh")}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">{t("Method")}</dt><dd>{t(METHODS.find((m) => m.key === method)!.label)}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold"><dt>{t("Total")}</dt><dd>{usd(PRICE)}</dd></div>
            </dl>
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-950">{t("Tax number, VAT line and the official invoice format would appear here. They need advice from a Cambodian tax professional before this can be used as a tax invoice.")}</div>
          </article>
        </div>
      )}
    </div>
  );
}
