import type { Metadata } from "next";
import { APP_NAME } from "@/lib/brand";

/** Fallback picture for link previews: amber card with the Piron Work mark (public/og-default.png, 1200x630). */
export const DEFAULT_OG_IMAGE = "/og-default.png";

const clean = (s: string | null | undefined, max = 160) => {
  const one = (s ?? "").replace(/\s+/g, " ").trim();
  return one.length > max ? one.slice(0, max - 1).trimEnd() + "…" : one;
};

/**
 * Title, description and image for a link that gets shared in Telegram, Facebook or Messenger.
 * `path` is the site path of the page; absolute URLs come from metadataBase in the root layout.
 * Pass `image` only when it is a square picture such as an avatar; the card then uses the small layout.
 */
export function shareMeta({ title, description, path, image, type = "website" }: { title: string; description?: string | null; path: string; image?: string | null; type?: "website" | "profile" | "article" }): Metadata {
  const desc = clean(description) || undefined;
  const picture = image || DEFAULT_OG_IMAGE;
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title: `${title} - ${APP_NAME}`, description: desc, url: path, siteName: APP_NAME, type, images: [{ url: picture, ...(image ? {} : { width: 1200, height: 630 }) }] },
    twitter: { card: image ? "summary" : "summary_large_image", title: `${title} - ${APP_NAME}`, description: desc, images: [picture] },
  };
}
