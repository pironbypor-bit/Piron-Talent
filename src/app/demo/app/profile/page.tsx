import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n/server";
import { ProfileView } from "./profile-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Profile") };
}

export default async function AppProfile() {
  const locale = await getLocale();
  return (
    <main className="px-4 py-4">
      <ProfileView locale={locale} />
    </main>
  );
}
