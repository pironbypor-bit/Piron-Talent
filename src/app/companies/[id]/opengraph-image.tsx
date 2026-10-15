import { companyPublic } from "@/lib/app/queries";
import { OG_SIZE, shareCard } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Piron Work";

/** Share picture for a public company page. Only pages that are public (or the member's own preview) return data. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await companyPublic(id);
  if (!c) return shareCard({ kicker: "Piron Work", title: "Piron Work" });
  return shareCard({ kicker: "Company", title: c.name, subtitle: [c.kind, c.city].filter(Boolean).join(" · ") });
}
