"use client";

import { useState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { createImplicitClient } from "@/lib/supabase/implicit-client";

export function ForgotForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "invalid" | "limited">("idle");

  if (state === "sent") return <Notice tone="success">{t("If that email has an account, a reset link is on its way.")}</Notice>;
  if (state === "limited") return <Notice tone="error">{t("Email limit reached. Try again in an hour.")}</Notice>;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setState("invalid");
        setState("busy");
        const { error } = await createImplicitClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/reset-password` });
        // A rate limit is worth saying; any other outcome gets the same answer so the form does not reveal which emails have accounts.
        setState(error && /rate limit/i.test(error.message) ? "limited" : "sent");
      }}
    >
      <Field label={t("Email")} error={state === "invalid" ? t("Please fill in this field.") : undefined}>
        <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
      </Field>
      <Button type="submit" disabled={state === "busy"}>
        {t("Send reset link")}
      </Button>
    </form>
  );
}
