import type { Metadata } from "next";
import Link from "next/link";
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
      <p className="mt-4 text-xs text-ink-muted">
        {t("By signing up you agree to the Terms of use and the Privacy page.")}{" "}
        <Link href="/terms" className="underline">{t("Terms of use")}</Link> · <Link href="/privacy" className="underline">{t("Privacy")}</Link>
      </p>
    </main>
  );
}
