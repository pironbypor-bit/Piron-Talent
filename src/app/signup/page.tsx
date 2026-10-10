import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { AuthForm } from "@/app/auth/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Create account") };
}

export default async function SignupPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <PageTitle>{t("Create account")}</PageTitle>
      <AuthForm mode="signup" />
    </main>
  );
}
