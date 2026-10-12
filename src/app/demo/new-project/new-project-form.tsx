"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { DEMO_CATEGORIES, pick, type DemoProject, type DemoProvider } from "@/lib/demo/fixtures";
import { Avatar } from "../demo-ui";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";

/** The Phase 2 structured-scope form, shown without saving anything. */
type Rehire = { project: DemoProject; provider?: DemoProvider };

export function NewProjectForm({ locale, rehire }: { locale: Locale; rehire?: Rehire }) {
  const t = useT();
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [openToAll, setOpenToAll] = useState(false);
  const old = rehire?.project;
  const who = rehire?.provider ? pick(rehire.provider.name, locale) : "";
  const v = (l?: { en: string; km: string }) => (l ? pick(l, locale) : "");
  if (sent && rehire?.provider) {
    return (
      <div className="space-y-4">
        <Notice tone="success">{t("Sent to {name}. The scope and the price from last time are attached.", { name: who })}</Notice>
        <p className="text-sm text-ink-muted">{openToAll ? t("Other providers can see it too.") : t("Opens to other providers after 24 hours if there is no reply.")}</p>
        <Link href="/demo/dashboard" className="inline-block font-medium underline">{t("Dashboard")}</Link>
      </div>
    );
  }
  if (sent) return <Notice tone="success">{t("In the live product this publishes the project and providers in this category are notified.")}</Notice>;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
        // A rehire stays on this page with a confirmation; a normal post lands on the project page, where quotes arrive.
        if (!rehire?.provider) router.push("/demo/projects/inventory-sheet?posted=1");
      }}
    >
      {rehire?.provider && (
        <div className="rounded-2xl border border-brand-300 bg-brand-50 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={who} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t("Goes to {name} first", { name: who })}</p>
              <p className="text-sm text-ink-muted">
                {old?.outcome ? t("Last time: ${price}, finished {date}", { price: old.outcome.price, date: old.outcome.completedOn }) : ""}
              </p>
            </div>
          </div>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={openToAll} onChange={(e) => setOpenToAll(e.target.checked)} className="mt-1" />
            <span>{t("Also show to other providers now")}</span>
          </label>
          {!openToAll && <p className="mt-1 pl-7 text-xs text-ink-muted">{t("Opens to other providers after 24 hours if there is no reply.")}</p>}
        </div>
      )}
      <Field label={t("Title")}>
        <input className={inputClass} defaultValue={v(old?.title)} />
      </Field>
      <Field label={t("Category")}>
        <select className={inputClass} defaultValue={old?.category ?? ""}>
          <option value="">{t("Choose a category")}</option>
          {DEMO_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {pick(c.name, locale)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("What do you need done?")}>
        <textarea rows={4} className={inputClass} defaultValue={v(old?.details)} />
      </Field>
      <Field label={t("Deliverables")} hint={t("One line per item")}>
        <textarea rows={3} className={inputClass} defaultValue={old ? old.deliverables.map((d) => pick(d, locale)).join("\n") : ""} />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">
          {t("Budget in USD")} <span className="font-normal text-ink-muted">({t("optional")})</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("from")}>
            <input inputMode="decimal" className={inputClass} defaultValue={old ? String(old.outcome?.price ?? old.budgetMin) : ""} />
          </Field>
          <Field label={t("to")}>
            <input inputMode="decimal" className={inputClass} defaultValue={old ? String(old.outcome?.price ?? old.budgetMax) : ""} />
          </Field>
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Deadline")}>
          <input type="date" className={inputClass} />
        </Field>
        <Field label={t("Where")}>
          <select className={inputClass} defaultValue={old?.remote ? "remote" : "onsite"}>
            <option value="onsite">{t("On site")}</option>
            <option value="remote">{t("Remote")}</option>
          </select>
        </Field>
      </div>
      <Field label={t("Photos")} optional={t("optional")}>
        <div className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-ink-muted">{t("Add photos")}</div>
      </Field>
      <label className="flex items-start gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm">
        <input type="checkbox" defaultChecked={!rehire?.provider} className="mt-1" />
        <span>{t("Show in the Workspace so providers can see it")}</span>
      </label>
      <Button type="submit">{rehire?.provider ? t("Send to {name}", { name: who }) : t("Publish project")}</Button>
    </form>
  );
}
