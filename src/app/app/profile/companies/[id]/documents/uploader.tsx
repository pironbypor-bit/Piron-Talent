"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { registerCompanyDocument } from "@/lib/app/actions";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/client";

const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX = 5 * 1024 * 1024;

/** Sends a file to the private company-files bucket, then records it as a Private document. */
export function DocumentUploader({ businessId }: { businessId: string }) {
  const t = useT();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!TYPES.includes(file.type)) return setError("Only images (JPG, PNG, WebP) and PDF files can be added.");
    if (file.size > MAX) return setError("The file is larger than 5 MB.");
    setBusy(true);
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
    const path = `${businessId}/${crypto.randomUUID()}.${ext}`;
    const up = await createClient().storage.from("company-files").upload(path, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      return setError("Upload failed.");
    }
    const res = await registerCompanyDocument(businessId, { path, name: file.name.slice(0, 120), mime: file.type, bytes: file.size });
    setBusy(false);
    if (!res.ok) return setError("The file could not be saved.");
    router.refresh();
  };

  return (
    <div>
      <input ref={input} type="file" accept={TYPES.join(",")} onChange={onPick} className="hidden" />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-brand-400 disabled:opacity-60">
        <Upload className="size-4" />{busy ? t("Uploading") : t("Add a file")}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{t(error)}</p>}
    </div>
  );
}
