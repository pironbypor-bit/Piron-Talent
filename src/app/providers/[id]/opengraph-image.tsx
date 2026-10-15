import { getProvider } from "@/lib/app/queries";
import { OG_SIZE, shareCard } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Piron Work";

/** Share picture for a public profile: name, role and place. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProvider(id);
  if (!data) return shareCard({ kicker: "Piron Work", title: "Piron Work" });
  const p = data.provider;
  return shareCard({ kicker: "Provider", title: p.display_name, subtitle: [p.role_line, p.city].filter(Boolean).join(" · ") });
}
