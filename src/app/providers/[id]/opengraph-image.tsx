import { getProvider } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";
import { OG_SIZE, shareCard } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Piron Work";

/** Share picture for a public profile: name, role and place. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const data = await getProvider(id);
  if (!data) return shareCard({ kicker: "Piron Work", title: "Piron Work" });
  const p = data.provider;
  return shareCard({ kicker: t("Provider"), title: p.display_name, subtitle: [p.role_line, p.city ? t(p.city) : null].filter(Boolean).join(" · ") });
}
