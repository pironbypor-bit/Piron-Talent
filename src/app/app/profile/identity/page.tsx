import type { Metadata } from "next";
import Link from "next/link";
import { Notice, PageTitle } from "@/components/ui";
import { getMe, myIdentityStatus } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";
import { IdentityFlow } from "./identity-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Identity check") };
}

export default async function IdentityPage() {
  const [t, me, status] = await Promise.all([getT(), getMe(), myIdentityStatus()]);
  if (!me) return null;
  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/profile" className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      <div className="mt-3">
        <PageTitle lead={t("Only Piron Work staff can see these photos and details. They are never shown on your profile.")}>{t("Identity check")}</PageTitle>
      </div>
      {status === "pending" ? (
        <Notice tone="info">{t("Pending review")}</Notice>
      ) : status === "checked" ? (
        <Notice tone="success">{t("Identity checked")}</Notice>
      ) : (
        <IdentityFlow userId={me.id} defaultName={me.display_name} />
      )}
    </main>
  );
}
