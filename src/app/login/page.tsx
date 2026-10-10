import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { AuthForm } from "@/app/auth/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Log in") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [t, { next }] = await Promise.all([getT(), searchParams]);
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <PageTitle>{t("Log in")}</PageTitle>
      <AuthForm mode="login" next={next} />
    </main>
  );
}
