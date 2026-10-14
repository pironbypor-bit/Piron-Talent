import type { Metadata } from "next";
import { ProviderProfile } from "@/app/app/providers/provider-profile";
import { getProvider } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";
import { shareMeta } from "@/lib/seo";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; reported?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const data = await getProvider(id);
  if (!data) return { title: "Piron Work" };
  const p = data.provider;
  const title = [p.display_name, p.role_line, p.city ? t(p.city) : null].filter(Boolean).join(" · ");
  return shareMeta({ title, description: p.bio ?? t("Skilled work, with checked identity and real reviews."), path: `/providers/${id}`, image: p.avatar_url, type: "profile" });
}

/** Public profile, same body as the app page but with the site header and footer. */
export default async function PublicProviderPage({ params, searchParams }: Props) {
  const [{ id }, { error, reported }] = await Promise.all([params, searchParams]);
  return <ProviderProfile id={id} base="" error={error} reported={reported} />;
}
