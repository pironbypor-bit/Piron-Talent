"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { categoryLabel, type Category } from "@/lib/category-label";
import { useLocale, useT } from "@/lib/i18n/client";
import { idle } from "@/lib/validation";
import { submitProjectRequest } from "./actions";

export function ProjectForm({ categories }: { categories: Category[] }) {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState(submitProjectRequest, idle);

  if (state.ok) {
    return (
      <div className="space-y-6">
        <Notice tone="success">{t("Thank you. We will contact you within one working day.")}</Notice>
        <Link href="/" className="inline-block font-medium underline">
          {t("Back to home")}
        </Link>
      </div>
    );
  }

  const err = (k: string) => (state.errors?.[k] ? t(state.errors[k]) : undefined);
  const val = (k: string) => state.values?.[k] ?? "";

  return (
    <form action={action} noValidate className="space-y-5">
      {state.message && <Notice tone="error">{t(state.message)}</Notice>}

      <Field label={t("Your name")} error={err("contact_name")}>
        <input name="contact_name" defaultValue={val("contact_name")} autoComplete="name" className={inputClass} aria-invalid={!!err("contact_name")} />
      </Field>
      <Field label={t("Phone or Telegram")} error={err("contact")}>
        <input name="contact" defaultValue={val("contact")} autoComplete="tel" className={inputClass} aria-invalid={!!err("contact")} />
      </Field>
      <Field label={t("Business name")} optional={t("optional")} error={err("business_name")}>
        <input name="business_name" defaultValue={val("business_name")} autoComplete="organization" className={inputClass} />
      </Field>
      <Field label={t("Category")} optional={t("optional")} error={err("category_id")}>
        <select name="category_id" defaultValue={val("category_id")} className={inputClass}>
          <option value="">{t("Choose a category")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryLabel(c, locale)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("What do you need done?")} error={err("details")}>
        <textarea name="details" rows={5} defaultValue={val("details")} className={inputClass} aria-invalid={!!err("details")} />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">
          {t("Budget in USD")} <span className="font-normal text-ink-muted">({t("optional")})</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("from")} error={err("budget_min")}>
            <input name="budget_min" inputMode="decimal" defaultValue={val("budget_min")} className={inputClass} aria-invalid={!!err("budget_min")} />
          </Field>
          <Field label={t("to")} error={err("budget_max")}>
            <input name="budget_max" inputMode="decimal" defaultValue={val("budget_max")} className={inputClass} aria-invalid={!!err("budget_max")} />
          </Field>
        </div>
      </fieldset>

      <Field label={t("When do you need it?")} optional={t("optional")} hint={t("For example: this week, before 20 March")} error={err("needed_by")}>
        <input name="needed_by" defaultValue={val("needed_by")} className={inputClass} />
      </Field>

      {/* People never see this field; bots fill it and the server drops the submission. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {t("Send request")}
      </Button>
    </form>
  );
}
