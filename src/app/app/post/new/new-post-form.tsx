"use client";

import { useActionState, useState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { createPost } from "@/lib/app/actions";
import { KIND_LABEL, type Author, type PostRow } from "@/lib/app/types";
import { AvatarImg } from "../../avatar";
import { categoryLabel, type Category } from "@/lib/category-label";
import { useLocale, useT } from "@/lib/i18n/client";
import { idle } from "@/lib/validation";

const KINDS = ["need_help", "offer_skill", "share_knowledge"] as const;

type Rehire = { post: PostRow; provider: Author };

export function NewPostForm({ categories, initialKind = "need_help", rehire }: { categories: Category[]; initialKind?: (typeof KINDS)[number]; rehire?: Rehire }) {
  const t = useT();
  const locale = useLocale();
  const [state, action, pending] = useActionState(createPost, idle);
  const [kind, setKind] = useState<(typeof KINDS)[number]>((state.values?.kind as (typeof KINDS)[number]) ?? initialKind);
  const [openNow, setOpenNow] = useState(false);
  const err = (k: string) => (state.errors?.[k] ? t(state.errors[k]) : undefined);
  const old = rehire?.post;
  const seed: Record<string, string> = old
    ? {
        title: old.title,
        body: old.body,
        category_id: old.category_id ? String(old.category_id) : "",
        place: old.place ?? "",
        price_text: old.price_text ?? "",
        deliverables: ((old as unknown as { deliverables?: string[] }).deliverables ?? []).join(String.fromCharCode(10)),
        budget_min: old.budget_min !== null ? String(old.budget_min) : "",
        budget_max: old.budget_max !== null ? String(old.budget_max) : "",
        remote: old.remote ? "on" : "",
      }
    : {};
  const val = (k: string, d = "") => state.values?.[k] ?? seed[k] ?? d;
  const who = rehire?.provider.display_name ?? "";

  return (
    <form action={action} noValidate className="space-y-4">
      {state.message && !state.ok && <Notice tone="error">{t(state.message)}</Notice>}
      {rehire && (
        <div className="rounded-2xl border border-brand-300 bg-brand-50 p-4">
          <input type="hidden" name="invited_provider_id" value={rehire.provider.id} />
          <div className="flex items-center gap-3">
            <AvatarImg name={who} url={rehire.provider.avatar_url} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t("Goes to {name} first", { name: who })}</p>
              {rehire.provider.role_line && <p className="text-sm text-ink-muted">{rehire.provider.role_line}</p>}
            </div>
          </div>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input type="checkbox" name="open_now" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} className="mt-1" />
            <span>{t("Also show to other providers now")}</span>
          </label>
          {!openNow && <p className="mt-1 pl-7 text-xs text-ink-muted">{t("Opens to other providers after 24 hours if there is no reply.")}</p>}
        </div>
      )}
      <fieldset className={rehire ? "hidden" : ""}>
        <legend className="mb-1.5 text-sm font-medium">{t("Post type")}</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <label key={k} className="cursor-pointer rounded-full border border-stone-300 px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white">
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {t(KIND_LABEL[k])}
            </label>
          ))}
        </div>
        {err("kind") && <p className="mt-1 text-sm text-red-700">{err("kind")}</p>}
      </fieldset>
      <Field label={t("Title")} error={err("title")}>
        <input name="title" defaultValue={val("title")} className={inputClass} aria-invalid={!!err("title")} />
      </Field>
      <Field label={t("Text")} error={err("body")}>
        <textarea name="body" rows={5} defaultValue={val("body")} className={inputClass} aria-invalid={!!err("body")} />
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
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("Place")} optional={t("optional")} error={err("place")}>
          <input name="place" defaultValue={val("place")} className={inputClass} />
        </Field>
        <Field label={t("Price or budget")} optional={t("optional")} hint={t("For example: $40 - $60")} error={err("price_text")}>
          <input name="price_text" defaultValue={val("price_text")} className={inputClass} />
        </Field>
      </div>
      {kind === "need_help" && (
        <fieldset className="card space-y-4 p-4">
          <legend className="sr-only">{t("Scope")}</legend>
          <p className="font-semibold">{t("Scope")}</p>
          <Field label={t("Deliverables")} optional={t("optional")} hint={t("One line per item")} error={err("deliverables")}>
            <textarea name="deliverables" rows={3} defaultValue={val("deliverables")} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Budget in USD")} optional={t("optional")} error={err("budget_min")}>
              <input name="budget_min" inputMode="decimal" defaultValue={val("budget_min")} placeholder={t("from")} className={inputClass} aria-invalid={!!err("budget_min")} />
            </Field>
            <Field label={t("to")} optional={t("optional")} error={err("budget_max")}>
              <input name="budget_max" inputMode="decimal" defaultValue={val("budget_max")} placeholder={t("to")} className={inputClass} aria-invalid={!!err("budget_max")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Deadline")} optional={t("optional")} error={err("deadline")}>
              <input type="date" name="deadline" defaultValue={val("deadline")} className={inputClass} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-3 text-sm">
              <input type="checkbox" name="remote" defaultChecked={val("remote") === "on"} /> {t("Remote work")}
            </label>
          </div>
        </fieldset>
      )}
      <p className="text-xs text-ink-muted">{t("Shift jobs (part-time, short-term) open after the legal review.")}</p>
      <Button type="submit" disabled={pending}>
        {rehire ? t("Send to {name}", { name: who }) : t("Publish")}
      </Button>
    </form>
  );
}
