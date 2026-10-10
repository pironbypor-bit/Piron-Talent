import { TabBar, TopBar } from "@/components/app-shell";

/** A phone-sized frame on desktop, full width on phones. The demo ribbon above comes from /demo/layout.tsx. */
export default function AppPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-stone-100 py-0 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col bg-white sm:min-h-[800px] sm:rounded-[2rem] sm:border-8 sm:border-stone-800 sm:shadow-xl">
        <TopBar base="/demo/app" name="Sophea" />
        <div className="app-bg flex-1">{children}</div>
        <TabBar base="/demo/app" />
      </div>
    </div>
  );
}
