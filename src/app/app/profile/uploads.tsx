"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Notice, inputClass } from "@/components/ui";
import { addPortfolioItem, removePortfolioItem, setAvatar } from "@/lib/app/actions";
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


export type PortfolioItem = { id: string; image_path: string; caption: string | null };

/** Portfolio section on Edit profile: up to 12 images in the public "portfolio" bucket, each with a caption. */
export function PortfolioEditor({ userId, items, max = 12 }: { userId: string; items: PortfolioItem[]; max?: number }) {
  const t = useT();
  const router = useRouter();
  const { busy, error, upload } = useUpload("portfolio", userId);
  const [caption, setCaption] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const publicUrl = (path: string) => createClient().storage.from("portfolio").getPublicUrl(path).data.publicUrl;
  const full = items.length >= max;

  return (
    <section className="space-y-3">
      <p className="text-sm text-ink-muted">{t("Up to 12 photos of your past work.")}</p>
      {items.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <img src={publicUrl(item.image_path)} alt={item.caption ?? ""} className="aspect-square w-full rounded-xl object-cover" />
              {item.caption && <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{item.caption}</p>}
              <button
                type="button"
                disabled={removing === item.id}
                onClick={async () => {
                  setRemoving(item.id);
                  await removePortfolioItem(item.id);
                  setRemoving(null);
                  router.refresh();
                }}
                className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink shadow hover:bg-white"
              >
                {t("Remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium">
              {t("Caption")} <span className="font-normal text-ink-muted">({t("optional")})</span>
            </span>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} className={inputClass} />
          </label>
          <label className="inline-block">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const path = await upload(f);
                if (path) {
                  await addPortfolioItem(path, caption);
                  setCaption("");
                  router.refresh();
                }
              }}
            />
            <Button type="button" variant="secondary" disabled={busy} onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement).click()}>
              {busy ? t("Uploading…") : t("Add to portfolio")}
            </Button>
          </label>
        </div>
      )}
      {error && <Notice tone="error">{t("Upload failed.")}</Notice>}
    </section>
  );
}
