"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/** Opens the phone's share sheet, or copies the link on a laptop. `path` is a site path such as /providers/<id>. */
export function ShareButton({ path, title, label, className = "" }: { path: string; title: string; label?: string; className?: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.origin + path;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* the person closed the share sheet */
    }
  };

  return (
    <button type="button" onClick={share} className={`inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-brand-50 ${className}`}>
      {copied ? <Check className="size-4 text-emerald-700" /> : <Share2 className="size-4" />}
      {copied ? t("Link copied") : label ?? t("Share")}
    </button>
  );
}
