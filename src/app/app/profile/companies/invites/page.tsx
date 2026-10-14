import type { Metadata } from "next";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { answerBusinessInvitation } from "@/lib/app/actions";
import { myBusinessInvitations } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Company invitations") };
}

/** Invitations to join a company's team. Accepting adds you to the team and its chat. */
export default async function CompanyInvitesPage() {
  const [t, invites] = await Promise.all([getT(), myBusinessInvitations()]);
  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/profile" className="text-sm font-medium underline">{t("Back")}</Link>
      <h1 className="mt-3 text-2xl font-bold">{t("Company invitations")}</h1>
      {invites.length === 0 ? (
        <div className="mt-4"><EmptyState>{t("No invitations waiting.")}</EmptyState></div>
      ) : (
        <ul className="card mt-4 divide-y divide-stone-100">
          {invites.map((i) => (
            <li key={i.id} className="px-4 py-3">
              <p className="font-semibold">{i.business_name}</p>
              <p className="text-sm text-ink-muted">{t("{name} invited you as {role}", { name: i.inviter, role: t(i.role === "manager" ? "Manager" : "Member") })}</p>
              <div className="mt-2 flex gap-2">
                <form action={answerBusinessInvitation.bind(null, i.id, true)}><Button type="submit" className="px-3 py-1.5 text-sm">{t("Accept")}</Button></form>
                <form action={answerBusinessInvitation.bind(null, i.id, false)}><Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">{t("Not now")}</Button></form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
