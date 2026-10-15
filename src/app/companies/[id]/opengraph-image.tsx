import { companyPublic } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";
import { OG_SIZE, shareCard } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Piron Work";

/** Share picture for a public company page. Only pages that are public (or the member's own preview) return data. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const c = await companyPublic(id);
  if (!c) return shareCard({ kicker: "Piron Work", title: "Piron Work" });
  return shareCard({ kicker: t("Company"), title: c.name, subtitle: [c.kind, c.city ? t(c.city) : null].filter(Boolean).join(" · ") });
}
