"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { idle } from "@/lib/validation";
import { logIn, signUp } from "./actions";

export function AuthForm({ mode, next }: { mode: "signup" | "login"; next?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(mode === "signup" ? signUp : logIn, idle);
  const err = (k: string) => (state.errors?.[k] ? t(state.errors[k]) : undefined);
  const val = (k: string) => state.values?.[k] ?? "";

  if (state.ok && state.message) return <Notice tone="success">{t(state.message)}</Notice>;

  return (
    <form action={action} noValidate className="space-y-5">
      {state.message && !state.ok && <Notice tone="error">{t(state.message)}</Notice>}
      {mode === "signup" && (
        <Field label={t("Display name")} error={err("display_name")}>
          <input name="display_name" defaultValue={val("display_name")} autoComplete="name" className={inputClass} aria-invalid={!!err("display_name")} />
        </Field>
      )}
      <Field label={t("Email")} error={err("email")}>
        <input name="email" type="email" defaultValue={val("email")} autoComplete="email" className={inputClass} aria-invalid={!!err("email")} />
      </Field>
      <Field label={t("Password")} hint={mode === "signup" ? t("At least 8 characters") : undefined} error={err("password")}>
        <input
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className={inputClass}
          aria-invalid={!!err("password")}
        />
      </Field>
      {mode === "login" && (
        <p className="-mt-2 text-sm">
          <Link href="/forgot-password" className="text-ink-muted underline">
            {t("Forgot password?")}
          </Link>
        </p>
      )}
      {next && <input type="hidden" name="next" value={next} />}
      <Button type="submit" disabled={pending}>
        {mode === "signup" ? t("Create account") : t("Log in")}
      </Button>
      <p className="text-sm text-ink-muted">
        {mode === "signup" ? t("Already have an account?") : t("No account yet?")}{" "}
        <Link href={mode === "signup" ? "/login" : "/signup"} className="font-medium text-ink underline">
          {mode === "signup" ? t("Log in") : t("Create account")}
        </Link>
      </p>
    </form>
  );
}
