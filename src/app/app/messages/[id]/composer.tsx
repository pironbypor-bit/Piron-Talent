"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

// The message box: text, and optionally one image or PDF up to 5 MB. The file goes straight from the browser to the
// private "message-files" bucket under the conversation's folder, then the message row points at it. Row level
// security checks membership and blocks on both steps.

const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX = 5 * 1024 * 1024;

export function MessageComposer({ conversationId, userId }: { conversationId: string; userId: string }) {
  const t = useT();
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    setError(null);
    if (f && !TYPES.includes(f.type)) return setError("Only images (JPG, PNG, WebP) and PDF files can be sent.");
    if (f && f.size > MAX) return setError("The file is larger than 5 MB.");
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body && !file) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    let attachment: { attachment_path: string; attachment_type: string } | null = null;
    if (file) {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
      const path = `${conversationId}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("message-files").upload(path, file, { contentType: file.type });
      if (up.error) {
        setBusy(false);
        return setError("Upload failed.");
      }
      attachment = { attachment_path: path, attachment_type: file.type };
    }
    const { error: insertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: body || file?.name.slice(0, 120) || "",
      ...(attachment ?? {}),
    });
    setBusy(false);
    if (insertError) return setError("The message could not be sent.");
    setText("");
    setFile(null);
    if (picker.current) picker.current.value = "";
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="sticky bottom-0 mt-4 bg-brand-50/40 py-2">
      {error && <p role="alert" className="mb-1 text-sm text-red-700">{t(error)}</p>}
      {file && (
        <p className="mb-1 flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm">
          <Paperclip className="size-4 text-ink-muted" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <button type="button" aria-label={t("Remove")} onClick={() => pick(null)} className="rounded-full p-1 hover:bg-stone-100"><X className="size-4" /></button>
        </p>
      )}
      <div className="flex gap-2">
        <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <button type="button" aria-label={t("Attach a file")} onClick={() => picker.current?.click()} className="shrink-0 rounded-xl border border-stone-300 bg-white px-3 hover:bg-brand-50">
          <Paperclip className="size-5" />
        </button>
        <input value={text} onChange={(e) => setText(e.target.value)} className={inputClass} placeholder={t("Type a message")} aria-label={t("Type a message")} maxLength={3000} autoComplete="off" />
        <Button type="submit" disabled={busy || (!text.trim() && !file)} className="px-4 py-2">
          {t("Send")}
        </Button>
      </div>
    </form>
  );
}
