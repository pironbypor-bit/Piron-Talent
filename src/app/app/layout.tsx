import type { Metadata } from "next";
import { TabBar, TopBar } from "@/components/app-shell";
import { LiveCountsProvider } from "@/components/live-counts";
import { logOut } from "@/app/auth/actions";
import { countUnread, countUnreadConversations, getMe, isOwner } from "@/lib/app/queries";

export const metadata: Metadata = { title: { default: "Piron Work", template: "%s - Piron Work" } };

/** The real app: same shell as the preview, full width on phones, a phone-wide column on desktop. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [me, unread, unreadMessages, owner] = await Promise.all([getMe(), countUnread(), countUnreadConversations(), isOwner()]);
  return (
    <LiveCountsProvider userId={me?.id ?? null} unread={unread} unreadMessages={unreadMessages}>
    <div className="bg-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white sm:border-x sm:border-stone-200">
        <TopBar base="/app" name={me?.display_name ?? ""} unread={unread} signedIn={!!me} avatarUrl={me?.avatar_url ?? null} notificationsHref="/app/notifications" logOut={logOut} spaceHref={owner ? "/admin/space" : undefined} />
        <div className="app-bg flex-1">{children}</div>
        <TabBar base="/app" />
      </div>
    </div>
    </LiveCountsProvider>
  );
}
