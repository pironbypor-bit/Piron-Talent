"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { resetPassword } from "@/app/auth/actions";
import { useT } from "@/lib/i18n/client";
import { idle } from "@/lib/validation";

export function ResetForm() {
  const t = useT();
  const [state, action, pending] = useActionState(resetPassword, idle);
  if (state.ok && state.message)
    return (
      <div className="space-y-4">
        <Notice tone="success">{t(state.message)}</Notice>
        <Link href="/app/profile" className="inline-block font-medium underline">
          {t("Open the app")}
        </Link>
      </div>
    );
  return (
    <form action={action} noValidate className="space-y-5">
      {state.message && !state.ok && (
        <Notice tone="error">
          {t(state.message)}{" "}
          <Link href="/forgot-password" className="underline">
            {t("Reset password")}
          </Link>
        </Notice>
      )}
      <Field label={t("New password")} hint={t("At least 8 characters")} error={state.errors?.password ? t(state.errors.password) : undefined}>
        <input name="password" type="password" autoComplete="new-password" className={inputClass} />
      </Field>
      <Button type="submit" disabled={pending}>
        {t("Save new password")}
      </Button>
    </form>
  );
}
