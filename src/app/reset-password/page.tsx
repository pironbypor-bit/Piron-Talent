import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { ResetForm } from "./reset-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("New password") };
}

export default async function ResetPasswordPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <PageTitle>{t("New password")}</PageTitle>
      <ResetForm />
    </main>
  );
}
