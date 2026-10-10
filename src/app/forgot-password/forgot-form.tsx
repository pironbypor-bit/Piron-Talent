"use client";

import { useState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { createImplicitClient } from "@/lib/supabase/implicit-client";

export function ForgotForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "invalid">("idle");

  if (state === "sent") return <Notice tone="success">{t("If that email has an account, a reset link is on its way.")}</Notice>;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setState("invalid");
        setState("busy");
        await createImplicitClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/reset-password` });
        // Always the same answer, so the form does not reveal which emails have accounts.
        setState("sent");
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
