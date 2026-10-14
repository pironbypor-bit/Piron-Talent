"use client";

import { useEffect, useState } from "react";
import { Notice } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { removePushSubscription, savePushSubscription } from "@/lib/app/actions";

// "Notify me on this phone": asks the phone once, registers the service worker, subscribes this device and
// stores the subscription for the database trigger. On iPhone it only works after Add to Home Screen.

type State = "checking" | "unsupported" | "ios-install" | "denied" | "off" | "on" | "busy";

const toKey = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const keyOf = (sub: PushSubscription, name: "p256dh" | "auth") => btoa(String.fromCharCode(...new Uint8Array(sub.getKey(name)!))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function PushSwitch({ publicKey }: { publicKey: string | null }) {
  const t = useT();
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);
      if (ios && !standalone) return setState("ios-install");
      if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [publicKey]);

  const turnOn = async () => {
    setState("busy");
    setError(null);
    try {
      if ((await Notification.requestPermission()) !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey!) }));
      await savePushSubscription({ endpoint: sub.endpoint, p256dh: keyOf(sub, "p256dh"), auth: keyOf(sub, "auth"), userAgent: navigator.userAgent.slice(0, 300) });
      setState("on");
    } catch {
      setError("Something went wrong. Please try again.");
      setState("off");
    }
  };

  const turnOff = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
    } finally {
      setState("off");
    }
  };

  const on = state === "on";
  const hint =
    state === "ios-install" ? t("On iPhone: open this site in Safari, tap Share, then Add to Home Screen, and turn this on from the installed app.")
    : state === "unsupported" ? t("This browser cannot show app notifications.")
    : state === "denied" ? t("Notifications are blocked for this site in the phone settings.")
    : t("A notification on this phone for quotes, messages and job updates, even when the app is closed.");

  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t("Notify me on this phone")}</span>
        <span className="block text-sm text-ink-muted">{hint}</span>
        {error && <span className="mt-1 block"><Notice tone="error">{t(error)}</Notice></span>}
      </span>
      {(state === "on" || state === "off" || state === "busy") && (
        <button type="button" role="switch" aria-checked={on} disabled={state === "busy"} aria-label={t("Notify me on this phone")} onClick={on ? turnOff : turnOn} className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${on ? "bg-brand-500" : "bg-stone-300"}`}>
          <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
        </button>
      )}
    </div>
  );
}
