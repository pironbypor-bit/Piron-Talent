import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Chat and social apps fetch a page to build the preview card when a link is shared; let them read shared projects and activities.
      { userAgent: ["facebookexternalhit", "Facebot", "TelegramBot", "WhatsApp", "Twitterbot", "LinkedInBot", "Slackbot"], allow: ["/app/post/", "/app/activities/"] },
      { userAgent: "*", allow: "/", disallow: ["/app", "/admin", "/dashboard", "/auth", "/login", "/signup", "/reset-password", "/forgot-password"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
