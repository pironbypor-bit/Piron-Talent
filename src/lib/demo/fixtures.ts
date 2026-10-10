import type { Locale } from "@/lib/i18n/core";

// Sample data for /demo. Nobody here is real; the story shows how one project runs on Piron Talent.
export type L = { en: string; km: string };
export const pick = (l: L, locale: Locale) => (locale === "km" ? l.km : l.en);

export type DemoProvider = {
  slug: string;
  name: L;
  role: L;
  city: L;
  years: number;
  completedJobs: number;
  rating: number;
  identityChecked: boolean;
  skills: L[];
  about: L;
  portfolio: { caption: L; tone: string }[];
  reviews: { customer: L; stars: number; text: L; date: string }[];
};

export type DemoQuote = {
  provider: string; // slug
  price: number;
  days: number;
  note: L;
};

export const customer = {
  name: { en: "Sophea's Cafe", km: "ហាងកាហ្វេ សុភា" },
  area: { en: "Toul Kork, Phnom Penh", km: "ទួលគោក ភ្នំពេញ" },
};

export const request = {
  title: { en: "Product photos for 12 menu items", km: "រូបថតផលិតផលសម្រាប់មុខម្ហូប 12 មុខ" },
  details: {
    en: "We need clean photos of 12 drinks and cakes for Facebook and the delivery app. White background, two sizes. Shooting at the cafe in the morning before opening.",
    km: "យើងត្រូវការរូបថតស្អាតនៃភេសជ្ជៈ និងនំ 12 មុខ សម្រាប់ Facebook និងកម្មវិធីដឹកជញ្ជូន។ ផ្ទៃខាងក្រោយពណ៌ស ទំហំពីរ។ ថតនៅហាងនៅពេលព្រឹកមុនបើក។",
  },
  category: { en: "Creative & Marketing", km: "ច្នៃប្រឌិត និងទីផ្សារ" },
  budgetMin: 60,
  budgetMax: 100,
  neededBy: { en: "Friday", km: "ថ្ងៃសុក្រ" },
  postedOn: "2027-02-02",
};

export const providers: DemoProvider[] = [
  {
    slug: "dara-vann",
    name: { en: "Dara Vann", km: "វ៉ាន់ ដារ៉ា" },
    role: { en: "Product photographer", km: "អ្នកថតរូបផលិតផល" },
    city: { en: "Phnom Penh", km: "ភ្នំពេញ" },
    years: 4,
    completedJobs: 14,
    rating: 4.9,
    identityChecked: true,
    skills: [
      { en: "Product photography", km: "ថតរូបផលិតផល" },
      { en: "Photo editing", km: "កែរូបថត" },
      { en: "Menu and catalogue shoots", km: "ថតមុខម្ហូប និងកាតាឡុក" },
    ],
    about: {
      en: "I shoot food and products for cafes and online shops. Simple setups, consistent light, files ready for Facebook and delivery apps.",
      km: "ខ្ញុំថតអាហារ និងផលិតផលសម្រាប់ហាងកាហ្វេ និងហាងអនឡាញ។ ការរៀបចំសាមញ្ញ ពន្លឺស្មើ ឯកសាររួចរាល់សម្រាប់ Facebook និងកម្មវិធីដឹកជញ្ជូន។",
    },
    portfolio: [
      { caption: { en: "Iced coffee set, 8 items", km: "ឈុតកាហ្វេទឹកកក 8 មុខ" }, tone: "bg-brand-200" },
      { caption: { en: "Bakery counter, 15 items", km: "តុនំប៉័ង 15 មុខ" }, tone: "bg-stone-200" },
      { caption: { en: "Skincare bottles for an online shop", km: "ដបថែរក្សាស្បែកសម្រាប់ហាងអនឡាញ" }, tone: "bg-brand-100" },
      { caption: { en: "Noodle shop menu board", km: "ក្តារមុខម្ហូបហាងមី" }, tone: "bg-stone-300" },
      { caption: { en: "Tea gift boxes", km: "ប្រអប់អំណោយតែ" }, tone: "bg-brand-300" },
      { caption: { en: "Smoothie bar, before and after edit", km: "ហាងទឹកផ្លែឈើ មុន និងក្រោយកែ" }, tone: "bg-stone-100" },
    ],
    reviews: [
      { customer: { en: "Sophea's Cafe", km: "ហាងកាហ្វេ សុភា" }, stars: 5, text: { en: "On time, photos look professional. Will hire again.", km: "ទាន់ពេល រូបថតមើលទៅមានជំនាញ។ នឹងជួលម្តងទៀត។" }, date: "2027-02-05" },
      { customer: { en: "Mekong Skincare", km: "មេគង្គ ស្គីនឃែរ" }, stars: 5, text: { en: "Clear communication and quick edits.", km: "ទំនាក់ទំនងច្បាស់លាស់ និងកែរហ័ស។" }, date: "2027-01-20" },
    ],
  },
  {
    slug: "lina-sok",
    name: { en: "Lina Sok", km: "សុខ លីណា" },
    role: { en: "Content creator", km: "អ្នកបង្កើតមាតិកា" },
    city: { en: "Phnom Penh", km: "ភ្នំពេញ" },
    years: 2,
    completedJobs: 6,
    rating: 4.7,
    identityChecked: true,
    skills: [
      { en: "Phone photography", km: "ថតរូបដោយទូរស័ព្ទ" },
      { en: "Short video for Reels and TikTok", km: "វីដេអូខ្លីសម្រាប់ Reels និង TikTok" },
      { en: "Captions in Khmer and English", km: "ចំណងជើងជាភាសាខ្មែរ និងអង់គ្លេស" },
    ],
    about: {
      en: "Student freelancer. I make simple, bright content for small shops and cafes, mostly on a phone.",
      km: "និស្សិតធ្វើការឯករាជ្យ។ ខ្ញុំបង្កើតមាតិកាសាមញ្ញ ភ្លឺស្អាត សម្រាប់ហាងតូចៗ និងហាងកាហ្វេ ភាគច្រើនដោយទូរស័ព្ទ។",
    },
    portfolio: [
      { caption: { en: "Bubble tea launch, 3 clips", km: "ការបើកដំណើរការតែគុជ 3 ឃ្លីប" }, tone: "bg-brand-100" },
      { caption: { en: "Weekend market stall photos", km: "រូបថតតូបផ្សារចុងសប្តាហ៍" }, tone: "bg-stone-200" },
      { caption: { en: "Cafe interior reel", km: "វីដេអូខាងក្នុងហាងកាហ្វេ" }, tone: "bg-brand-200" },
    ],
    reviews: [{ customer: { en: "Chea Mart", km: "ជា ម៉ាត" }, stars: 5, text: { en: "Fast and friendly, good for social media.", km: "រហ័ស និងរួសរាយ ល្អសម្រាប់បណ្តាញសង្គម។" }, date: "2027-01-28" }],
  },
  {
    slug: "pisey-chan",
    name: { en: "Pisey Chan", km: "ចាន់ ពិសី" },
    role: { en: "Studio photographer", km: "អ្នកថតរូបស្ទូឌីយោ" },
    city: { en: "Phnom Penh", km: "ភ្នំពេញ" },
    years: 7,
    completedJobs: 31,
    rating: 5,
    identityChecked: true,
    skills: [
      { en: "Studio lighting", km: "ពន្លឺស្ទូឌីយោ" },
      { en: "Packaging and product shots", km: "ថតវេចខ្ចប់ និងផលិតផល" },
      { en: "Retouching", km: "កែលម្អរូបភាព" },
    ],
    about: {
      en: "Small studio near Russian Market. Packaging, jewellery and food. Same-day delivery for small sets.",
      km: "ស្ទូឌីយោតូចនៅជិតផ្សារទួលទំពូង។ វេចខ្ចប់ គ្រឿងអលង្ការ និងអាហារ។ ប្រគល់ក្នុងថ្ងៃតែមួយសម្រាប់ឈុតតូច។",
    },
    portfolio: [
      { caption: { en: "Jewellery set on dark background", km: "ឈុតគ្រឿងអលង្ការលើផ្ទៃងងឹត" }, tone: "bg-stone-300" },
      { caption: { en: "Snack packaging line, 20 items", km: "ជួរវេចខ្ចប់អាហារសម្រន់ 20 មុខ" }, tone: "bg-brand-200" },
      { caption: { en: "Restaurant signature dishes", km: "មុខម្ហូបពិសេសភោជនីយដ្ឋាន" }, tone: "bg-brand-300" },
      { caption: { en: "Cosmetics catalogue", km: "កាតាឡុកគ្រឿងសម្អាង" }, tone: "bg-stone-100" },
    ],
    reviews: [{ customer: { en: "Angkor Snacks", km: "អង្គរ ស្នាក់" }, stars: 5, text: { en: "Excellent studio work, worth the price.", km: "ការងារស្ទូឌីយោល្អឥតខ្ចោះ សមនឹងតម្លៃ។" }, date: "2027-01-15" }],
  },
];

export const quotes: DemoQuote[] = [
  { provider: "dara-vann", price: 85, days: 2, note: { en: "Includes simple editing and two sizes for Facebook and the delivery app.", km: "រួមបញ្ចូលការកែសាមញ្ញ និងទំហំពីរសម្រាប់ Facebook និងកម្មវិធីដឹកជញ្ជូន។" } },
  { provider: "lina-sok", price: 60, days: 3, note: { en: "Phone photos plus three short clips for Reels.", km: "រូបថតដោយទូរស័ព្ទ បូកនឹងឃ្លីបខ្លីបីសម្រាប់ Reels។" } },
  { provider: "pisey-chan", price: 120, days: 1, note: { en: "Studio lighting brought to the cafe, two background options.", km: "យកពន្លឺស្ទូឌីយោមកហាង ជម្រើសផ្ទៃខាងក្រោយពីរ។" } },
];

/** The quote the sample customer accepted, and what happened after. */
export const outcome = {
  acceptedProvider: "dara-vann",
  acceptedOn: "2027-02-03",
  completedOn: "2027-02-05",
  price: 85,
  delivered: { en: "12 edited photos in two sizes, delivered by Telegram", km: "រូបថតកែរួច 12 សន្លឹកក្នុងទំហំពីរ ប្រគល់តាម Telegram" },
};

export const providerBySlug = (slug: string) => providers.find((p) => p.slug === slug);
