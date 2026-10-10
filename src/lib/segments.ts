/** The three paid acquisition tests from the business plan (product plan section 3.1). English text is the i18n key. */
export type Segment = {
  slug: string;
  side: "customer" | "provider";
  kicker: string;
  title: string;
  lead: string;
  points: string[];
  /** Example tasks: label, category slug, and the prefilled details text for the form. */
  tasks: { label: string; category: string; details?: string }[];
  cta: string;
};

export const SEGMENTS: Segment[] = [
  {
    slug: "online-sellers",
    side: "customer",
    kicker: "For online sellers",
    title: "Product photos, page design and short videos, from checked providers",
    lead: "Sell on Facebook, TikTok or Telegram? Post what you need. We send two or three quotes from providers in Phnom Penh.",
    points: ["Product photos that look the same across your whole page", "Posters and short videos for each promotion", "A simple stock and order sheet you can keep yourself"],
    tasks: [
      { label: "Product photo shoot, 20 items", category: "creative", details: "Product photo shoot for about 20 items, white background, for my Facebook page." },
      { label: "Page cover and 5 post designs", category: "creative", details: "Facebook page cover and 5 post designs for a promotion." },
      { label: "Short video for a promotion", category: "creative", details: "One short video (15 to 30 seconds) for a promotion on TikTok and Facebook." },
      { label: "Stock and order sheet in Excel", category: "documents", details: "A simple Excel sheet to track stock and daily orders." },
    ],
    cta: "Post a project",
  },
  {
    slug: "cafes",
    side: "customer",
    kicker: "For cafes and shops",
    title: "Menus, photos, bookkeeping and paperwork, done by people we have checked",
    lead: "Running a cafe or a shop takes every hour of the day. Post the task, compare quotes, and pay the provider directly when it is done.",
    points: ["Menu and price board design that matches your brand", "Monthly bookkeeping and help with tax filing", "Staff contracts, leave forms and other templates"],
    tasks: [
      { label: "New menu design, two pages", category: "creative", details: "New menu design, two pages, print ready. I have the dish list and prices." },
      { label: "Monthly bookkeeping, small cafe", category: "finance", details: "Monthly bookkeeping for a small cafe, around 30 receipts a week." },
      { label: "Interior and food photos", category: "creative", details: "Interior and food photos for our Facebook page and Google listing." },
      { label: "Staff contract and leave form templates", category: "documents", details: "Khmer and English staff contract template and a leave request form." },
    ],
    cta: "Post a project",
  },
  {
    slug: "students",
    side: "provider",
    kicker: "For students and new graduates",
    title: "Turn your skills into paid work and a record you can show",
    lead: "Design, video, writing, spreadsheets, IT support. Join, quote on projects that fit your time, and build a record of completed jobs.",
    points: ["Projects sized for part-time work", "Your identity checked once, then shown on every quote", "Each completed job and review stays on your profile"],
    tasks: [
      { label: "Graphic design", category: "creative" },
      { label: "Video editing", category: "creative" },
      { label: "Data entry and Excel", category: "documents" },
      { label: "IT support", category: "technology" },
    ],
    cta: "Join as a provider",
  },
];

export const segmentBySlug = (slug: string) => SEGMENTS.find((s) => s.slug === slug) ?? null;
