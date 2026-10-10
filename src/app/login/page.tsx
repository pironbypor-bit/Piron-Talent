import type { Metadata } from "next";
import { Notice, PageTitle } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { AuthForm } from "@/app/auth/auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Log in") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; confirmed?: string }> }) {
  const [t, { next, error, confirmed }] = await Promise.all([getT(), searchParams]);
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <PageTitle>{t("Log in")}</PageTitle>
      {confirmed === "1" && (
        <div className="mb-5">
          <Notice tone="success">{t("Email confirmed. Log in to continue.")}</Notice>
        </div>
      )}
      {error === "link" && (
        <div className="mb-5">
          <Notice tone="error">{t("This link has expired. Request a new one.")}</Notice>
        </div>
      )}
      <AuthForm mode="login" next={next} />
    </main>
  );
}
