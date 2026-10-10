"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { setAvatar } from "@/lib/app/actions";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

// Files go straight from the browser to Supabase Storage with the person's own session; RLS limits each
// person to their own folder. The avatar is public; the ID photo lands in the private "identity" bucket.

function useUpload(bucket: string, userId: string) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: e } = await createClient().storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    setBusy(false);
    if (e) {
      setError(e.message);
      return null;
    }
    return path;
  };
  return { busy, error, upload };
}

export function AvatarUpload({ userId }: { userId: string }) {
  const t = useT();
  const router = useRouter();
  const { busy, error, upload } = useUpload("avatars", userId);
  return (
    <div className="mt-2">
      <label className="inline-block">
        <span className="sr-only">{t("Upload photo")}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const path = await upload(f);
            if (path) {
              await setAvatar(path);
              router.refresh();
            }
          }}
        />
        <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm" disabled={busy} onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement).click()}>
          {t("Upload photo")}
        </Button>
      </label>
      {error && <div className="mt-2"><Notice tone="error">{t("Upload failed.")}</Notice></div>}
    </div>
  );
}

