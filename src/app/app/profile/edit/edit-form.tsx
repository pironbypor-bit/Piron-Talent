"use client";

import { useActionState, useState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { updateProfile } from "@/lib/app/actions";
import type { MeRow } from "@/lib/app/types";
import { categoryLabel, type Category } from "@/lib/category-label";
import { CITIES, HAS_DISTRICTS } from "@/lib/cities";
import { useLocale, useT } from "@/lib/i18n/client";
import { idle } from "@/lib/validation";

export function EditProfileForm({ me, categories }: { me: MeRow; categories: Category[] }) {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState(updateProfile, idle);
  const err = (k: string) => (state.errors?.[k] ? t(state.errors[k]) : undefined);
  const val = (k: string, d: string) => state.values?.[k] ?? d;
  const checked = (k: string, d: boolean) => (state.values ? state.values[k] === "on" : d);
  const [city, setCity] = useState(val("city", me.city ?? "Phnom Penh"));

  return (
    <form action={action} noValidate className="space-y-4">
      {state.message && <Notice tone={state.ok ? "success" : "error"}>{t(state.message)}</Notice>}
      <Field label={t("Display name")} error={err("display_name")}>
        <input name="display_name" defaultValue={val("display_name", me.display_name)} className={inputClass} aria-invalid={!!err("display_name")} />
      </Field>
      <Field label={t("Role line")} optional={t("optional")} hint={t("For example: Product photographer")} error={err("role_line")}>
        <input name="role_line" defaultValue={val("role_line", me.role_line ?? "")} className={inputClass} />
      </Field>
      <Field label={t("About")} optional={t("optional")} error={err("bio")}>
        <textarea name="bio" rows={4} defaultValue={val("bio", me.bio ?? "")} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("City")} error={err("city")}>
          <select name="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
            <option value="">{t("Choose a city")}</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {t(c)}
              </option>
            ))}
          </select>
        </Field>
        {city === HAS_DISTRICTS && (
          <Field label={t("District")} optional={t("optional")} hint={t("For example: Toul Kork")} error={err("district")}>
            <input name="district" defaultValue={val("district", me.district ?? "")} maxLength={60} className={inputClass} />
          </Field>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
        <input type="checkbox" name="is_available" defaultChecked={checked("is_available", me.is_available)} className="mt-1" />
        <span>{t("I offer services (show me in Services)")}</span>
      </label>
      <Field label={t("Main category")} optional={t("optional")} error={err("primary_category_id")}>
        <select name="primary_category_id" defaultValue={val("primary_category_id", me.primary_category_id ? String(me.primary_category_id) : "")} className={inputClass}>
          <option value="">{t("Choose a category")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryLabel(c, locale)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("Skills, separated by commas")} optional={t("optional")} error={err("skills")}>
        <input name="skills" defaultValue={val("skills", me.skills.join(", "))} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("Starting price")} optional={t("optional")} hint={t("For example: $25 / visit")} error={err("price_from")}>
          <input name="price_from" defaultValue={val("price_from", me.price_from ?? "")} className={inputClass} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" name="remote" defaultChecked={checked("remote", me.remote)} /> {t("Works remotely")}
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {t("Save")}
      </Button>
    </form>
  );
}
