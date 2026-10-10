"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { createImplicitClient } from "@/lib/supabase/implicit-client";

// The reset link lands here with the session in the URL hash. The implicit client reads it, stores the session
// in the auth cookies, and then the new password is saved with that session.
export function ResetForm() {
  const t = useT();
  const client = useRef<ReturnType<typeof createImplicitClient> | null>(null);
  const [ready, setReady] = useState<"checking" | "ok" | "expired">("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = createImplicitClient();
    client.current = c;
    const hashSaysExpired = /error_code=otp_expired|error=access_denied/.test(window.location.hash);
    const { data: sub } = c.auth.onAuthStateChange((_event, session) => {
      if (session) setReady("ok");
    });
    c.auth.getSession().then(({ data }) => setReady(data.session ? "ok" : hashSaysExpired ? "expired" : "checking"));
    const timer = setTimeout(() => setReady((r) => (r === "checking" ? "expired" : r)), 4000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (done)
    return (
      <div className="space-y-4">
        <Notice tone="success">{t("Password updated. You are logged in.")}</Notice>
        <a href="/app/profile" className="inline-block font-medium underline">
          {t("Open the app")}
        </a>
      </div>
    );

  if (ready === "expired")
    return (
      <Notice tone="error">
        {t("This link has expired. Request a new one.")}{" "}
        <Link href="/forgot-password" className="underline">
          {t("Reset password")}
        </Link>
      </Notice>
    );

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 8) return setError("At least 8 characters");
        if (password.length > 200) return setError("Too long.");
        setBusy(true);
        setError(null);
        const { error: err } = await client.current!.auth.updateUser({ password });
        setBusy(false);
        if (err) return setReady("expired");
        setDone(true);
      }}
    >
      <Field label={t("New password")} hint={t("At least 8 characters")} error={error ? t(error) : undefined}>
        <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
      </Field>
      <Button type="submit" disabled={busy || ready !== "ok"}>
        {t("Save new password")}
      </Button>
    </form>
  );
}
