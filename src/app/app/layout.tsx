import type { Metadata } from "next";
import { TabBar, TopBar } from "@/components/app-shell";
import { LiveCountsProvider } from "@/components/live-counts";
import { logOut } from "@/app/auth/actions";
import { getT } from "@/lib/i18n/server";
import { getFeatures } from "@/lib/app/features";
import { countUnread, countUnreadConversations, getMe, isOwner } from "@/lib/app/queries";

export const metadata: Metadata = { title: { default: "Piron Work", template: "%s - Piron Work" } };

/** The real app: same shell as the preview, full width on phones, a phone-wide column on desktop. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [me, unread, unreadMessages, owner, t, features] = await Promise.all([getMe(), countUnread(), countUnreadConversations(), isOwner(), getT(), getFeatures()]);
  const hiddenTabs = features.includes("payments") ? [] : ["payments"];
  return (
    <LiveCountsProvider userId={me?.id ?? null} unread={unread} unreadMessages={unreadMessages}>
    <div className="bg-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white sm:border-x sm:border-stone-200">
        <TopBar base="/app" name={me?.display_name ?? ""} unread={unread} signedIn={!!me} avatarUrl={me?.avatar_url ?? null} notificationsHref="/app/notifications" logOut={logOut} spaceHref={owner ? "/admin/space" : undefined} />
        <div className="app-bg flex-1">
          {me?.paused_at ? (
            <main className="px-4 py-10">
              <section className="card p-5">
                <h1 className="text-xl font-bold">{t("Your account is paused")}</h1>
                <p className="mt-2 text-sm text-ink-muted">{t("The Piron Work team paused your account. You cannot post, send quotes, message or change your profile for now. If you think this is a mistake, write to pironbypor@gmail.com.")}</p>
                <form action={logOut} className="mt-4">
                  <button type="submit" className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-brand-50">{t("Log out")}</button>
                </form>
              </section>
            </main>
          ) : (
            children
          )}
        </div>
        <TabBar base="/app" hide={hiddenTabs} />
      </div>
    </div>
    </LiveCountsProvider>
  );
}
