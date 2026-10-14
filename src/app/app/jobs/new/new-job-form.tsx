"use client";

import { useActionState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { createJob } from "@/lib/app/actions";
import { useT } from "@/lib/i18n/client";
import { idle } from "@/lib/validation";

export function NewJobForm({ businessId }: { businessId?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(createJob, idle);
  const err = (k: string) => (state.errors?.[k] ? t(state.errors[k]) : undefined);
  const val = (k: string, d = "") => state.values?.[k] ?? d;

  return (
    <form action={action} noValidate className="space-y-4">
      {businessId && <input type="hidden" name="business_id" value={businessId} />}
      {state.message && !state.ok && <Notice tone="error">{t(state.message)}</Notice>}
      <Field label={t("Job title")} error={err("title")}>
        <input name="title" defaultValue={val("title")} className={inputClass} aria-invalid={!!err("title")} />
      </Field>
      <Field label={t("Description")} error={err("description")}>
        <textarea name="description" rows={5} defaultValue={val("description")} className={inputClass} aria-invalid={!!err("description")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("Job type")} error={err("job_type")}>
          <select name="job_type" defaultValue={val("job_type", "freelance")} className={inputClass}>
            <option value="freelance">{t("Freelance")}</option>
            <option value="project">{t("Project based")}</option>
          </select>
        </Field>
        <Field label={t("City")} optional={t("optional")} error={err("city")}>
          <input name="city" defaultValue={val("city", "Phnom Penh")} className={inputClass} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("Pay")} optional={t("optional")} error={err("pay_amount")}>
          <input name="pay_amount" inputMode="decimal" defaultValue={val("pay_amount")} className={inputClass} aria-invalid={!!err("pay_amount")} />
        </Field>
        <Field label={t("Pay unit")} error={err("pay_unit")}>
          <select name="pay_unit" defaultValue={val("pay_unit", "project")} className={inputClass}>
            <option value="hour">{t("hour")}</option>
            <option value="day">{t("day")}</option>
            <option value="project">{t("project")}</option>
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="remote_available" defaultChecked={val("remote_available") === "on"} /> {t("Remote work")}
      </label>
      <Button type="submit" disabled={pending}>
        {t("Publish")}
      </Button>
    </form>
  );
}
