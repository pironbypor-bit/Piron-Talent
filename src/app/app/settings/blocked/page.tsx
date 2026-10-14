import type { Metadata } from "next";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { unblockUser } from "@/lib/app/actions";
import { myBlocks } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Blocked people") };
}

/** People I blocked. They are not told; unblocking restores nothing that was refused meanwhile. */
export default async function BlockedPage() {
  const [t, blocks] = await Promise.all([getT(), myBlocks()]);
  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/settings" className="text-sm font-medium underline">{t("Back")}</Link>
      <h1 className="mt-3 text-2xl font-bold">{t("Blocked people")}</h1>
      <p className="text-sm text-ink-muted">{t("They cannot message you, send requests, invite you or add you to groups. They are not told.")}</p>
      {blocks.length === 0 ? (
        <div className="mt-4"><EmptyState>{t("You have not blocked anyone.")}</EmptyState></div>
      ) : (
        <ul className="card mt-4 divide-y divide-stone-100">
          {blocks.map((b) => (
            <li key={b.user.id} className="flex items-center gap-3 px-3 py-3">
              <AvatarImg name={b.user.display_name} url={b.user.avatar_url} />
              <Link href={`/app/providers/${b.user.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{b.user.display_name}</Link>
              <form action={unblockUser.bind(null, b.user.id, "/app/settings/blocked")}>
                <Button type="submit" variant="secondary" className="px-3 py-1.5 text-sm">{t("Unblock")}</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
