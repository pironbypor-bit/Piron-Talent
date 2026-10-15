"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/client";

// Minimal shape of the browser speech recogniser; the standard type is not in the TypeScript DOM library.
type Result = { isFinal: boolean; 0: { transcript: string } };
type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<Result> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type RecCtor = new () => Rec;
const ctor = (): RecCtor | null => {
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/**
 * Voice typing for a textarea in the same form. The browser turns speech into text (Khmer on a Khmer page) and the words
 * are added to the end of the box, so the person can still read and edit them before sending.
 * Chrome sends the audio to its own speech service for this; the note under the button says so.
 */
export function DictateButton({ field }: { field: string }) {
  const t = useT();
  const locale = useLocale();
  const holder = useRef<HTMLDivElement>(null);
  const rec = useRef<Rec | null>(null);
  const [state, setState] = useState<"idle" | "listening">("idle");
  const [problem, setProblem] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(ctor() !== null);
    return () => rec.current?.stop();
  }, []);

  const append = (text: string) => {
    const area = holder.current?.closest("form")?.querySelector<HTMLTextAreaElement>(`textarea[name="${field}"]`);
    if (!area || !text.trim()) return;
    area.value = (area.value ? area.value.replace(/\s+$/, "") + " " : "") + text.trim();
    area.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const toggle = () => {
    if (state === "listening") return rec.current?.stop();
    const C = ctor();
    if (!C) return;
    setProblem(null);
    const r = new C();
    r.lang = locale === "km" ? "km-KH" : "en-US";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let said = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) said += e.results[i][0].transcript + " ";
      append(said);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setProblem("Allow the microphone in your browser to use voice typing.");
      else if (e.error === "language-not-supported") setProblem("This browser cannot type Khmer by voice. Try Chrome.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setProblem("Voice typing stopped. Please try again.");
    };
    r.onend = () => setState("idle");
    rec.current = r;
    try {
      r.start();
      setState("listening");
    } catch {
      setProblem("Voice typing stopped. Please try again.");
    }
  };

  if (!supported) return <p className="-mt-2 text-xs text-ink-muted">{t("Voice typing works in Chrome on Android and on a laptop.")}</p>;

  return (
    <div ref={holder} className="-mt-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={state === "listening"}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${state === "listening" ? "border-red-300 bg-red-50 text-red-800" : "border-stone-300 bg-white hover:bg-brand-50"}`}
      >
        {state === "listening" ? <Square className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
        {state === "listening" ? t("Stop") : t("Speak instead of typing")}
      </button>
      <p className="mt-1 text-xs text-ink-muted" role={problem ? "alert" : undefined}>
        {problem ? t(problem) : state === "listening" ? t("Listening. Speak now, then press Stop.") : t("Your browser turns your voice into text. Check the words before you send.")}
      </p>
    </div>
  );
}
