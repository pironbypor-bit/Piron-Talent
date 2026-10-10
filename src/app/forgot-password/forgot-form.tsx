"use client";

import { useActionState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { forgotPassword } from "@/app/auth/actions";
import { useT } from "@/lib/i18n/client";
import { idle } from "@/lib/validation";

export function ForgotForm() {
  const t = useT();
  const [state, action, pending] = useActionState(forgotPassword, idle);
  if (state.ok && state.message) return <Notice tone="success">{t(state.message)}</Notice>;
  return (
    <form action={action} noValidate className="space-y-5">
      <Field label={t("Email")} error={state.errors?.email ? t(state.errors.email) : undefined}>
        <input name="email" type="email" defaultValue={state.values?.email ?? ""} autoComplete="email" className={inputClass} />
      </Field>
      <Button type="submit" disabled={pending}>
        {t("Send reset link")}
      </Button>
    </form>
  );
}
