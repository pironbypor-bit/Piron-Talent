import { ImageResponse } from "next/og";
import { KHMER_BOLD_B64, LATIN_BOLD_B64 } from "@/lib/og-fonts";

export const OG_SIZE = { width: 1200, height: 630 };

const bytes = (b64: string) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
};

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/**
 * The picture shown when a link to a profile, project, company or activity is shared.
 * Text comes from our own database for that one item (never from the URL), so the route cannot be used to make arbitrary images.
 * Latin and Khmer both render: the two embedded subsets are tried in order for every character.
 */
export function shareCard({ kicker, title, subtitle }: { kicker: string; title: string; subtitle?: string | null }) {
  const long = title.length > 60;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f5b800", padding: "64px 72px", fontFamily: "Latin, Khmer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", background: "#1c1917", color: "#f5b800", fontSize: 30, padding: "8px 24px", borderRadius: 999 }}>{clip(kicker, 40)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", color: "#1c1917", fontSize: long ? 60 : 82, lineHeight: 1.25 }}>{clip(title, 110)}</div>
          {subtitle ? <div style={{ display: "flex", color: "#44403c", fontSize: 38, lineHeight: 1.3 }}>{clip(subtitle, 120)}</div> : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#1c1917", fontSize: 36 }}>
          <div style={{ display: "flex" }}>Piron Work</div>
          <div style={{ display: "flex", fontSize: 28, color: "#44403c" }}>app.piron.tech</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Latin", data: bytes(LATIN_BOLD_B64), weight: 700, style: "normal" },
        { name: "Khmer", data: bytes(KHMER_BOLD_B64), weight: 700, style: "normal" },
      ],
    },
  );
}
