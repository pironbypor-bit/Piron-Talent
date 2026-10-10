"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { categoryLabel, type Category } from "@/lib/category-label";
import { useLocale, useT } from "@/lib/i18n/client";
import { idle } from "@/lib/validation";
import { submitProviderApplication } from "./actions";

export function ProviderForm({ categories }: { categories: Category[] }) {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState(submitProviderApplication, idle);

  if (state.ok) {
    return (
      <div className="space-y-6">
        <Notice tone="success">{t("Thank you. We will contact you when a suitable project comes up.")}</Notice>
        <Link href="/" className="inline-block font-medium underline">
          {t("Back to home")}
        </Link>
      </div>
    );
  }

  const err = (k: string) => (state.errors?.[k] ? t(state.errors[k]) : undefined);
  const val = (k: string, fallback = "") => state.values?.[k] ?? fallback;

  return (
    <form action={action} noValidate className="space-y-5">
      {state.message && <Notice tone="error">{t(state.message)}</Notice>}

      <Field label={t("Full name")} error={err("full_name")}>
        <input name="full_name" defaultValue={val("full_name")} autoComplete="name" className={inputClass} aria-invalid={!!err("full_name")} />
      </Field>
      <Field label={t("Phone or Telegram")} error={err("contact")}>
        <input name="contact" defaultValue={val("contact")} autoComplete="tel" className={inputClass} aria-invalid={!!err("contact")} />
      </Field>
      <Field label={t("City")} error={err("city")}>
        <input name="city" defaultValue={val("city", "Phnom Penh")} autoComplete="address-level2" className={inputClass} aria-invalid={!!err("city")} />
      </Field>
      <Field label={t("Main category")} optional={t("optional")} error={err("category_id")}>
        <select name="category_id" defaultValue={val("category_id")} className={inputClass}>
          <option value="">{t("Choose a category")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryLabel(c, locale)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("Your skills")} hint={t("For example: product photography, Excel, Khmer-English translation")} error={err("skills")}>
        <textarea name="skills" rows={4} defaultValue={val("skills")} className={inputClass} aria-invalid={!!err("skills")} />
      </Field>
      <Field label={t("Years of experience")} optional={t("optional")} error={err("experience_years")}>
        <input name="experience_years" inputMode="decimal" defaultValue={val("experience_years")} className={`${inputClass} max-w-40`} aria-invalid={!!err("experience_years")} />
      </Field>
      <Field label={t("Link to past work")} optional={t("optional")} error={err("portfolio_url")}>
        <input name="portfolio_url" inputMode="url" defaultValue={val("portfolio_url")} className={inputClass} aria-invalid={!!err("portfolio_url")} />
      </Field>

      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {t("Apply")}
      </Button>
    </form>
  );
}
