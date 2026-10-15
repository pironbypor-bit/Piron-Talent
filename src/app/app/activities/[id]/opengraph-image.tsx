import { getActivity } from "@/lib/app/queries";
import { formatRange } from "@/lib/datetime";
import { getLocale, getT } from "@/lib/i18n/server";
import { OG_SIZE, shareCard } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Piron Work";

/** Share picture for a volunteer activity: title, when and where. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t, locale] = await Promise.all([params, getT(), getLocale()]);
  const data = await getActivity(id);
  if (!data) return shareCard({ kicker: "Piron Work", title: "Piron Work" });
  const a = data.activity;
  return shareCard({ kicker: t("Volunteer activity"), title: a.title, subtitle: [formatRange(a.starts_at, a.ends_at, locale), a.place, a.city ? t(a.city) : null].filter(Boolean).join(" · ") });
}
