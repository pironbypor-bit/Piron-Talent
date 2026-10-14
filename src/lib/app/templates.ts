/** Request templates for the Job offer form: the common pilot tasks, with a scope people can edit. English text is the i18n key. */
export type RequestTemplate = {
  slug: string;
  category: string; // categories.slug
  label: string;
  title: string;
  body: string;
  deliverables: string[];
  budget: [number, number];
  remote: boolean;
};

export const TEMPLATES: RequestTemplate[] = [
  { slug: "product-photos", category: "creative", label: "Product photos", title: "Product photos for my shop", body: "Photos of my products for Facebook and the menu. White background, consistent light, files ready to post.", deliverables: ["20 edited photos, white background", "Two sizes: Facebook and delivery app", "Delivered by Telegram or Drive"], budget: [60, 100], remote: false },
  { slug: "menu-design", category: "creative", label: "Menu design", title: "New menu design, two pages", body: "A clean menu for my cafe, two pages, print ready. I have the dish list and prices in a document.", deliverables: ["Two-page menu, print-ready PDF", "Editable source file", "One round of changes"], budget: [40, 80], remote: true },
  { slug: "logo-refresh", category: "creative", label: "Logo refresh", title: "Refresh my logo", body: "Make my existing logo cleaner for Facebook, the menu and signage. Keep the colours and the name.", deliverables: ["Logo in PNG and SVG", "Square version for Facebook", "Two options to choose from"], budget: [30, 60], remote: true },
  { slug: "promo-video", category: "creative", label: "Short promo video", title: "Short video for a promotion", body: "One short video, 15 to 30 seconds, for TikTok and Facebook. I can send photos and the offer text.", deliverables: ["One 15 to 30 second vertical video", "Khmer text on screen", "Two revisions"], budget: [25, 60], remote: true },
  { slug: "facebook-posts", category: "creative", label: "Facebook post designs", title: "Facebook page cover and 5 post designs", body: "A new page cover and five post designs for this month's promotion, in my brand colours.", deliverables: ["Page cover image", "5 post designs, square", "Editable files"], budget: [30, 70], remote: true },
  { slug: "bookkeeping", category: "finance", label: "Monthly bookkeeping", title: "Monthly bookkeeping for a small shop", body: "Record my sales and expenses each month from receipts I send by Telegram, and prepare a simple monthly report.", deliverables: ["Monthly income and expense report", "Receipts organised by month", "Help with the tax filing when due"], budget: [40, 90], remote: true },
  { slug: "inventory-sheet", category: "documents", label: "Stock sheet in Excel", title: "Excel inventory sheet for my products", body: "One sheet with products, suppliers, cost, sell price and a low-stock warning. Training for one staff member.", deliverables: ["Excel file with all products entered", "Low-stock warning column", "One hour of training at the shop"], budget: [50, 90], remote: false },
  { slug: "staff-forms", category: "documents", label: "Staff contract templates", title: "Staff contract and leave form templates", body: "Khmer and English staff contract template and a leave request form that I can reuse for new staff.", deliverables: ["Contract template in Word, Khmer and English", "Leave request form", "Short note on how to fill them"], budget: [30, 60], remote: true },
  { slug: "pos-setup", category: "technology", label: "POS and printer setup", title: "POS and kitchen printer setup", body: "Set up a POS on a tablet with a kitchen printer, and show one staff member how to use it.", deliverables: ["POS installed and tested", "Kitchen printer connected", "Half-day training on site"], budget: [40, 80], remote: false },
  { slug: "shop-website", category: "technology", label: "Simple shop website", title: "Simple one-page website for my shop", body: "A one-page site with my menu or products, opening hours, map and a Telegram button. Khmer and English.", deliverables: ["One-page website, phone friendly", "Khmer and English text", "Connected to my domain or a free address"], budget: [80, 200], remote: true },
];

export const templateBySlug = (slug: string | undefined) => TEMPLATES.find((x) => x.slug === slug) ?? null;
