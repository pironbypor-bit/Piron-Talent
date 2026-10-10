import type { Metadata } from "next";
import { Inter, Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";
import { APP_NAME, TAGLINE } from "@/lib/brand";
import { getLocale } from "@/lib/i18n/server";
import { messagesFor } from "@/lib/i18n/messages";
import { I18nProvider } from "@/lib/i18n/client";
import { SiteFooter, SiteHeader } from "@/components/site-header";

// Latin from Inter, Khmer from Noto Sans Khmer; the browser picks per glyph, so mixed lines look right.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const khmer = Noto_Sans_Khmer({ subsets: ["khmer"], variable: "--font-khmer", display: "swap", weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: "%s - " + APP_NAME },
  description: TAGLINE,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${inter.variable} ${khmer.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <I18nProvider locale={locale} messages={messagesFor(locale)}>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
