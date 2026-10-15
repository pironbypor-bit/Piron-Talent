"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { createImplicitClient } from "@/lib/supabase/implicit-client";

// The reset link lands here with the session in the URL hash (#access_token=...). The implicit client reads it
// and keeps it in memory. When the new password is saved, the session is handed to the main client so the
// person is logged in to the app.
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
    c.auth.getSession().then(({ data }) => {
      if (data.session) setReady("ok");
      else if (hashSaysExpired) setReady("expired");
    });
    // Keep the tokens out of the address bar and the browser history once they are read.
    const clear = setTimeout(() => {
      if (window.location.hash.includes("access_token")) window.history.replaceState(null, "", window.location.pathname);
    }, 1500);
    const timer = setTimeout(() => setReady((r) => (r === "checking" ? "expired" : r)), 6000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
      clearTimeout(clear);
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
        const c = client.current!;
        const { error: err } = await c.auth.updateUser({ password });
        if (err) {
          setBusy(false);
          const code = (err as { code?: string }).code ?? "";
          const msg = err.message.toLowerCase();
          if (code === "same_password" || msg.includes("different from the old")) return setError("Choose a password that is different from your old one.");
          if (code === "weak_password" || msg.includes("weak") || msg.includes("easy to guess") || msg.includes("pwned")) return setError("That password is too easy to guess. Use a longer one with letters and numbers.");
          if (code === "session_not_found" || code === "session_expired" || msg.includes("session") || err.status === 401 || err.status === 403) return setReady("expired");
          return setError("Could not save the password. Please try again.");
        }
        // Log the person in to the app with the same session.
        const { data } = await c.auth.getSession();
        if (data.session) {
          await createClient().auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
        }
        setBusy(false);
        setDone(true);
      }}
    >
      <Field label={t("New password")} hint={t("At least 8 characters")} error={error ? t(error) : undefined}>
        <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
      </Field>
      <Button type="submit" disabled={busy || ready !== "ok"}>
        {t("Save new password")}
      </Button>
      {ready === "checking" && <p className="text-sm text-ink-muted">{t("Checking your link...")}</p>}
    </form>
  );
}
