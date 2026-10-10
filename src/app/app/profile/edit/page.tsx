import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { getMe } from "@/lib/app/queries";
import { getCategories } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { EditProfileForm } from "./edit-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Edit profile") };
}

export default async function EditProfilePage() {
  const [t, me, categories] = await Promise.all([getT(), getMe(), getCategories()]);
  if (!me) return null;
  return (
    <main className="px-4 py-4">
      <Link href="/app/profile" className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      <div className="mt-3">
        <PageTitle>{t("Edit profile")}</PageTitle>
      </div>
      <EditProfileForm me={me} categories={categories} />
    </main>
  );
}
