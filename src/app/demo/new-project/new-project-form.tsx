"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { DEMO_CATEGORIES, pick } from "@/lib/demo/fixtures";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/core";

/** The Phase 2 structured-scope form, shown without saving anything. */
export function NewProjectForm({ locale }: { locale: Locale }) {
  const t = useT();
  const router = useRouter();
  const [sent, setSent] = useState(false);
  if (sent) return <Notice tone="success">{t("In the live product this publishes the project and providers in this category are notified.")}</Notice>;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
        // After posting, the customer lands on their own project page, where quotes arrive.
        router.push("/demo/projects/inventory-sheet?posted=1");
      }}
    >
      <Field label={t("Title")}>
        <input className={inputClass} defaultValue="" />
      </Field>
      <Field label={t("Category")}>
        <select className={inputClass} defaultValue="">
          <option value="">{t("Choose a category")}</option>
          {DEMO_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {pick(c.name, locale)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("What do you need done?")}>
        <textarea rows={4} className={inputClass} />
      </Field>
      <Field label={t("Deliverables")} hint={t("One line per item")}>
        <textarea rows={3} className={inputClass} />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">
          {t("Budget in USD")} <span className="font-normal text-ink-muted">({t("optional")})</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("from")}>
            <input inputMode="decimal" className={inputClass} />
          </Field>
          <Field label={t("to")}>
            <input inputMode="decimal" className={inputClass} />
          </Field>
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Deadline")}>
          <input type="date" className={inputClass} />
        </Field>
        <Field label={t("Where")}>
          <select className={inputClass} defaultValue="onsite">
            <option value="onsite">{t("On site")}</option>
            <option value="remote">{t("Remote")}</option>
          </select>
        </Field>
      </div>
      <Field label={t("Photos")} optional={t("optional")}>
        <div className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-ink-muted">{t("Add photos")}</div>
      </Field>
      <label className="flex items-start gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm">
        <input type="checkbox" defaultChecked className="mt-1" />
        <span>{t("Show on the community board so providers can see it")}</span>
      </label>
      <Button type="submit">{t("Publish project")}</Button>
    </form>
  );
}
