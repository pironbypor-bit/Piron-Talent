import type { Metadata } from "next";
import { TabBar, TopBar } from "@/components/app-shell";
import { getMe } from "@/lib/app/queries";
import { countUnread } from "@/lib/app/queries";

export const metadata: Metadata = { title: { default: "Piron Talent", template: "%s - Piron Talent" } };

/** The real app: same shell as the preview, full width on phones, a phone-wide column on desktop. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [me, unread] = await Promise.all([getMe(), countUnread()]);
  return (
    <div className="bg-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white sm:border-x sm:border-stone-200">
        <TopBar base="/app" name={me?.display_name ?? ""} unread={unread} signedIn={!!me} />
        <div className="flex-1 bg-brand-50/40">{children}</div>
        <TabBar base="/app" />
      </div>
    </div>
  );
}
