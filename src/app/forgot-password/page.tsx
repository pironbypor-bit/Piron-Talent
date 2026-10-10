import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { ForgotForm } from "./forgot-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Reset password") };
}

export default async function ForgotPasswordPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <PageTitle lead={t("Enter your email and we send a link to set a new password.")}>{t("Reset password")}</PageTitle>
      <ForgotForm />
    </main>
  );
}
