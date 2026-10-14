import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";
import { APP_NAME, TAGLINE } from "@/lib/brand";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { getLocale } from "@/lib/i18n/server";
import { messagesFor } from "@/lib/i18n/messages";
import { I18nProvider } from "@/lib/i18n/client";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { HideOn } from "@/components/hide-on";

// Latin from Inter, Khmer from Noto Sans Khmer; the browser picks per glyph, so mixed lines look right.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const khmer = Noto_Sans_Khmer({ subsets: ["khmer"], variable: "--font-khmer", display: "swap", weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: APP_NAME, template: "%s - " + APP_NAME },
  description: TAGLINE,
  manifest: "/manifest.webmanifest",
  openGraph: { siteName: APP_NAME, type: "website", title: APP_NAME, description: TAGLINE, images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: APP_NAME, description: TAGLINE, images: [DEFAULT_OG_IMAGE] },
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#f5b800" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${inter.variable} ${khmer.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <I18nProvider locale={locale} messages={messagesFor(locale)}>
          <HideOn prefixes={["/app", "/demo/app"]}>
            <SiteHeader />
          </HideOn>
          <div className="flex-1">{children}</div>
          <HideOn prefixes={["/app", "/demo/app"]}>
            <SiteFooter />
          </HideOn>
        </I18nProvider>
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN}"}`} />
        )}
      </body>
    </html>
  );
}
