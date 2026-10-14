import type { Locale } from "@/lib/i18n/core";

// Sample data for /demo. Nobody here is real; the pages show how Piron Work works.
export type L = { en: string; km: string };
export const pick = (l: L, locale: Locale) => (locale === "km" ? l.km : l.en);

export type CityKey = "phnom-penh" | "siem-reap" | "battambang" | "other";

export type DemoProvider = {
  slug: string;
  name: L;
  role: L;
  category: string; // slug from public.categories
  city: L;
  cityKey: CityKey;
  district?: L; // Phnom Penh only
  remote: boolean;
  years: number;
  completedJobs: number;
  rating: number;
  identityChecked: boolean;
  skills: L[];
  about: L;
  portfolio: { caption: L; tone: string }[];
  reviews: { customer: L; stars: number; text: L; date: string }[];
};

export type DemoQuote = { provider: string; price: number; days: number; note: L };

export type DemoProject = {
  id: string;
  customer: { name: L; area: L };
  title: L;
  details: L;
  deliverables: L[];
  category: string;
  categoryName: L;
  budgetMin: number;
  budgetMax: number;
  deadline: L;
  remote: boolean;
  postedOn: string;
  quotes: DemoQuote[];
  /** What happened in the story (used by the walkthrough and the dashboard). */
  outcome?: { acceptedProvider: string; acceptedOn: string; completedOn: string; price: number; delivered: L };
};

export const DEMO_CATEGORIES: { slug: string; name: L }[] = [
  { slug: "creative", name: { en: "Creative & Marketing", km: "ច្នៃប្រឌិត និងទីផ្សារ" } },
  { slug: "documents", name: { en: "Documents & Administration", km: "ឯកសារ និងរដ្ឋបាល" } },
  { slug: "technology", name: { en: "IT & Technology", km: "ព័ត៌មានវិទ្យា និងបច្ចេកវិទ្យា" } },
];
export const categoryName = (slug: string, locale: Locale) => {
  const c = DEMO_CATEGORIES.find((x) => x.slug === slug);
  return c ? pick(c.name, locale) : slug;
};

const PP = { en: "Phnom Penh", km: "ភ្នំពេញ" };
const SR = { en: "Siem Reap", km: "សៀមរាប" };
const BB = { en: "Battambang", km: "បាត់ដំបង" };
export const DEMO_CITIES: { key: CityKey; name: L }[] = [
  { key: "phnom-penh", name: PP },
  { key: "siem-reap", name: SR },
  { key: "battambang", name: BB },
  { key: "other", name: { en: "Other", km: "ផ្សេងទៀត" } },
];
const D = {
  toulKork: { en: "Toul Kork", km: "ទួលគោក" },
  bkk: { en: "BKK", km: "បឹងកេងកង" },
  senSok: { en: "Sen Sok", km: "សែនសុខ" },
  russianMarket: { en: "Russian Market", km: "ផ្សារទួលទំពូង" },
  chbarAmpov: { en: "Chbar Ampov", km: "ច្បារអំពៅ" },
};

export const providers: DemoProvider[] = [
  {
    slug: "dara-vann", name: { en: "Dara Vann", km: "វ៉ាន់ ដារ៉ា" }, role: { en: "Product photographer", km: "អ្នកថតរូបផលិតផល" },
    category: "creative", city: PP, cityKey: "phnom-penh", district: D.toulKork, remote: false, years: 4, completedJobs: 14, rating: 4.9, identityChecked: true,
    skills: [{ en: "Product photography", km: "ថតរូបផលិតផល" }, { en: "Photo editing", km: "កែរូបថត" }, { en: "Menu and catalogue shoots", km: "ថតមុខម្ហូប និងកាតាឡុក" }],
    about: { en: "I shoot food and products for cafes and online shops. Simple setups, consistent light, files ready for Facebook and delivery apps.", km: "ខ្ញុំថតអាហារ និងផលិតផលសម្រាប់ហាងកាហ្វេ និងហាងអនឡាញ។ ការរៀបចំសាមញ្ញ ពន្លឺស្មើ ឯកសាររួចរាល់សម្រាប់ Facebook និងកម្មវិធីដឹកជញ្ជូន។" },
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
    slug: "lina-sok", name: { en: "Lina Sok", km: "សុខ លីណា" }, role: { en: "Content creator", km: "អ្នកបង្កើតមាតិកា" },
    category: "creative", city: PP, cityKey: "phnom-penh", district: D.bkk, remote: true, years: 2, completedJobs: 6, rating: 4.7, identityChecked: true,
    skills: [{ en: "Phone photography", km: "ថតរូបដោយទូរស័ព្ទ" }, { en: "Short video for Reels and TikTok", km: "វីដេអូខ្លីសម្រាប់ Reels និង TikTok" }, { en: "Captions in Khmer and English", km: "ចំណងជើងជាភាសាខ្មែរ និងអង់គ្លេស" }],
    about: { en: "Student freelancer. I make simple, bright content for small shops and cafes, mostly on a phone.", km: "និស្សិតធ្វើការឯករាជ្យ។ ខ្ញុំបង្កើតមាតិកាសាមញ្ញ ភ្លឺស្អាត សម្រាប់ហាងតូចៗ និងហាងកាហ្វេ ភាគច្រើនដោយទូរស័ព្ទ។" },
    portfolio: [
      { caption: { en: "Bubble tea launch, 3 clips", km: "ការបើកដំណើរការតែគុជ 3 ឃ្លីប" }, tone: "bg-brand-100" },
      { caption: { en: "Weekend market stall photos", km: "រូបថតតូបផ្សារចុងសប្តាហ៍" }, tone: "bg-stone-200" },
      { caption: { en: "Cafe interior reel", km: "វីដេអូខាងក្នុងហាងកាហ្វេ" }, tone: "bg-brand-200" },
    ],
    reviews: [{ customer: { en: "Chea Mart", km: "ជា ម៉ាត" }, stars: 5, text: { en: "Fast and friendly, good for social media.", km: "រហ័ស និងរួសរាយ ល្អសម្រាប់បណ្តាញសង្គម។" }, date: "2027-01-28" }],
  },
  {
    slug: "pisey-chan", name: { en: "Pisey Chan", km: "ចាន់ ពិសី" }, role: { en: "Studio photographer", km: "អ្នកថតរូបស្ទូឌីយោ" },
    category: "creative", city: PP, cityKey: "phnom-penh", district: D.senSok, remote: false, years: 7, completedJobs: 31, rating: 5, identityChecked: true,
    skills: [{ en: "Studio lighting", km: "ពន្លឺស្ទូឌីយោ" }, { en: "Packaging and product shots", km: "ថតវេចខ្ចប់ និងផលិតផល" }, { en: "Retouching", km: "កែលម្អរូបភាព" }],
    about: { en: "Small studio near Russian Market. Packaging, jewellery and food. Same-day delivery for small sets.", km: "ស្ទូឌីយោតូចនៅជិតផ្សារទួលទំពូង។ វេចខ្ចប់ គ្រឿងអលង្ការ និងអាហារ។ ប្រគល់ក្នុងថ្ងៃតែមួយសម្រាប់ឈុតតូច។" },
    portfolio: [
      { caption: { en: "Jewellery set on dark background", km: "ឈុតគ្រឿងអលង្ការលើផ្ទៃងងឹត" }, tone: "bg-stone-300" },
      { caption: { en: "Snack packaging line, 20 items", km: "ជួរវេចខ្ចប់អាហារសម្រន់ 20 មុខ" }, tone: "bg-brand-200" },
      { caption: { en: "Restaurant signature dishes", km: "មុខម្ហូបពិសេសភោជនីយដ្ឋាន" }, tone: "bg-brand-300" },
      { caption: { en: "Cosmetics catalogue", km: "កាតាឡុកគ្រឿងសម្អាង" }, tone: "bg-stone-100" },
    ],
    reviews: [{ customer: { en: "Angkor Snacks", km: "អង្គរ ស្នាក់" }, stars: 5, text: { en: "Excellent studio work, worth the price.", km: "ការងារស្ទូឌីយោល្អឥតខ្ចោះ សមនឹងតម្លៃ។" }, date: "2027-01-15" }],
  },
  {
    slug: "sokha-lim", name: { en: "Sokha Lim", km: "លឹម សុខា" }, role: { en: "Khmer-English translator", km: "អ្នកបកប្រែខ្មែរ-អង់គ្លេស" },
    category: "documents", city: PP, cityKey: "phnom-penh", district: D.russianMarket, remote: true, years: 6, completedJobs: 22, rating: 4.8, identityChecked: true,
    skills: [{ en: "Contracts and business documents", km: "កិច្ចសន្យា និងឯកសារអាជីវកម្ម" }, { en: "Website and menu translation", km: "បកប្រែគេហទំព័រ និងមុខម្ហូប" }, { en: "Proofreading", km: "កែអក្ខរាវិរុទ្ធ" }],
    about: { en: "Former NGO translator. Business and legal documents, clear and on time. Remote only.", km: "អតីតអ្នកបកប្រែអង្គការ។ ឯកសារអាជីវកម្ម និងច្បាប់ ច្បាស់លាស់ និងទាន់ពេល។ ធ្វើពីចម្ងាយតែប៉ុណ្ណោះ។" },
    portfolio: [
      { caption: { en: "Supplier agreement, 12 pages", km: "កិច្ចព្រមព្រៀងអ្នកផ្គត់ផ្គង់ 12 ទំព័រ" }, tone: "bg-stone-200" },
      { caption: { en: "Restaurant menu, 60 items", km: "មុខម្ហូបភោជនីយដ្ឋាន 60 មុខ" }, tone: "bg-brand-100" },
      { caption: { en: "Company profile brochure", km: "ខិត្តប័ណ្ណប្រវត្តិក្រុមហ៊ុន" }, tone: "bg-stone-100" },
    ],
    reviews: [{ customer: { en: "Bayon Logistics", km: "បាយ័ន ឡូជីស្ទិក" }, stars: 5, text: { en: "Accurate legal terms, delivered a day early.", km: "ពាក្យច្បាប់ត្រឹមត្រូវ ប្រគល់មុនមួយថ្ងៃ។" }, date: "2027-01-30" }],
  },
  {
    slug: "vanna-keo", name: { en: "Vanna Keo", km: "កែវ វណ្ណា" }, role: { en: "Excel and data entry", km: "Excel និងបញ្ចូលទិន្នន័យ" },
    category: "documents", city: PP, cityKey: "phnom-penh", district: D.chbarAmpov, remote: true, years: 3, completedJobs: 9, rating: 4.6, identityChecked: true,
    skills: [{ en: "Inventory sheets", km: "តារាងស្តុក" }, { en: "Excel formulas and dashboards", km: "រូបមន្ត Excel និងផ្ទាំងទិន្នន័យ" }, { en: "Data cleaning", km: "សម្អាតទិន្នន័យ" }],
    about: { en: "I build simple spreadsheets that shop owners can keep using without me.", km: "ខ្ញុំបង្កើតតារាងសាមញ្ញដែលម្ចាស់ហាងអាចបន្តប្រើដោយគ្មានខ្ញុំ។" },
    portfolio: [
      { caption: { en: "Pharmacy stock sheet, 450 items", km: "តារាងស្តុកឱសថស្ថាន 450 មុខ" }, tone: "bg-brand-200" },
      { caption: { en: "Monthly sales dashboard", km: "ផ្ទាំងលក់ប្រចាំខែ" }, tone: "bg-stone-300" },
    ],
    reviews: [{ customer: { en: "Chea Mart", km: "ជា ម៉ាត" }, stars: 4, text: { en: "Good sheet, needed one small fix after.", km: "តារាងល្អ ត្រូវការកែតូចមួយបន្ទាប់មក។" }, date: "2027-01-10" }],
  },
  {
    slug: "rithy-phan", name: { en: "Rithy Phan", km: "ផាន់ រិទ្ធី" }, role: { en: "IT support and websites", km: "ជំនួយ IT និងគេហទំព័រ" },
    category: "technology", city: PP, cityKey: "phnom-penh", district: D.toulKork, remote: false, years: 5, completedJobs: 17, rating: 4.9, identityChecked: true,
    skills: [{ en: "POS and printer setup", km: "ដំឡើង POS និងម៉ាស៊ីនបោះពុម្ព" }, { en: "Wi-Fi and cameras", km: "Wi-Fi និងកាមេរ៉ា" }, { en: "Simple shop websites", km: "គេហទំព័រហាងសាមញ្ញ" }],
    about: { en: "On-site IT help for shops and cafes in Phnom Penh. Fixed prices for common jobs.", km: "ជំនួយ IT នៅទីកន្លែងសម្រាប់ហាង និងហាងកាហ្វេនៅភ្នំពេញ។ តម្លៃថេរសម្រាប់ការងារធម្មតា។" },
    portfolio: [
      { caption: { en: "Cafe POS with kitchen printer", km: "POS ហាងកាហ្វេជាមួយម៉ាស៊ីនបោះពុម្ពផ្ទះបាយ" }, tone: "bg-stone-200" },
      { caption: { en: "Four-camera setup for a minimart", km: "ដំឡើងកាមេរ៉ាបួនសម្រាប់មីនីម៉ាត" }, tone: "bg-brand-100" },
    ],
    reviews: [{ customer: { en: "Toul Kork Minimart", km: "មីនីម៉ាតទួលគោក" }, stars: 5, text: { en: "Came the same day, explained everything.", km: "មកថ្ងៃតែមួយ ពន្យល់គ្រប់យ៉ាង។" }, date: "2027-02-01" }],
  },
  {
    slug: "chanthy-ros", name: { en: "Chanthy Ros", km: "រស់ ចន្ធី" }, role: { en: "Hotel and event photographer", km: "អ្នកថតរូបសណ្ឋាគារ និងព្រឹត្តិការណ៍" },
    category: "creative", city: SR, cityKey: "siem-reap", remote: false, years: 6, completedJobs: 19, rating: 4.8, identityChecked: true,
    skills: [{ en: "Hotel and restaurant photos", km: "រូបថតសណ្ឋាគារ និងភោជនីយដ្ឋាន" }, { en: "Event photography", km: "ថតរូបព្រឹត្តិការណ៍" }, { en: "Drone shots", km: "ថតពីដ្រូន" }],
    about: { en: "Based in Siem Reap. I photograph guesthouses, restaurants and events for booking sites and Facebook.", km: "មានមូលដ្ឋាននៅសៀមរាប។ ខ្ញុំថតផ្ទះសំណាក់ ភោជនីយដ្ឋាន និងព្រឹត្តិការណ៍សម្រាប់គេហទំព័រកក់ និង Facebook។" },
    portfolio: [
      { caption: { en: "Boutique guesthouse, 24 rooms", km: "ផ្ទះសំណាក់ប៊ូទិក 24 បន្ទប់" }, tone: "bg-brand-200" },
      { caption: { en: "Riverside restaurant at dusk", km: "ភោជនីយដ្ឋានមាត់ទន្លេពេលល្ងាច" }, tone: "bg-stone-200" },
      { caption: { en: "Wedding at Wat Bo", km: "អាពាហ៍ពិពាហ៍នៅវត្តបូព៌" }, tone: "bg-brand-100" },
    ],
    reviews: [{ customer: { en: "Angkor Lane Guesthouse", km: "ផ្ទះសំណាក់ អង្គរឡេន" }, stars: 5, text: { en: "Bookings went up after the new photos.", km: "ការកក់កើនឡើងបន្ទាប់ពីរូបថតថ្មី។" }, date: "2027-02-10" }],
  },
  {
    slug: "sreymom-ouk", name: { en: "Sreymom Ouk", km: "អ៊ុក ស្រីមុំ" }, role: { en: "Bookkeeper, Excel and reports", km: "អ្នកកាន់បញ្ជី Excel និងរបាយការណ៍" },
    category: "documents", city: BB, cityKey: "battambang", remote: true, years: 8, completedJobs: 12, rating: 4.9, identityChecked: true,
    skills: [{ en: "Monthly bookkeeping", km: "គណនេយ្យប្រចាំខែ" }, { en: "Excel reports", km: "របាយការណ៍ Excel" }, { en: "Tax filing preparation", km: "រៀបចំលិខិតប្រកាសពន្ធ" }],
    about: { en: "Remote bookkeeping for small shops anywhere in Cambodia. Send receipts by Telegram, get a clean monthly report.", km: "គណនេយ្យពីចម្ងាយសម្រាប់ហាងតូចៗគ្រប់ទីកន្លែងក្នុងកម្ពុជា។ ផ្ញើវិក្កយបត្រតាម Telegram ទទួលបានរបាយការណ៍ប្រចាំខែស្អាត។" },
    portfolio: [
      { caption: { en: "Monthly report for a rice shop", km: "របាយការណ៍ប្រចាំខែសម្រាប់ហាងអង្ករ" }, tone: "bg-stone-200" },
      { caption: { en: "Stock sheet, 120 products", km: "តារាងស្តុក 120 មុខ" }, tone: "bg-brand-100" },
    ],
    reviews: [{ customer: { en: "Battambang Rice Supply", km: "បាត់ដំបង ផ្គត់ផ្គង់អង្ករ" }, stars: 5, text: { en: "Reports arrive on the first of the month, every month.", km: "របាយការណ៍មកដល់ថ្ងៃទីមួយនៃខែ រាល់ខែ។" }, date: "2027-02-03" }],
  },
];

export const projects: DemoProject[] = [
  {
    id: "cafe-photos",
    customer: { name: { en: "Sophea's Cafe", km: "ហាងកាហ្វេ សុភា" }, area: { en: "Toul Kork, Phnom Penh", km: "ទួលគោក ភ្នំពេញ" } },
    title: { en: "Product photos for 12 menu items", km: "រូបថតផលិតផលសម្រាប់មុខម្ហូប 12 មុខ" },
    details: { en: "We need clean photos of 12 drinks and cakes for Facebook and the delivery app. White background, two sizes. Shooting at the cafe in the morning before opening.", km: "យើងត្រូវការរូបថតស្អាតនៃភេសជ្ជៈ និងនំ 12 មុខ សម្រាប់ Facebook និងកម្មវិធីដឹកជញ្ជូន។ ផ្ទៃខាងក្រោយពណ៌ស ទំហំពីរ។ ថតនៅហាងនៅពេលព្រឹកមុនបើក។" },
    deliverables: [{ en: "12 edited photos, white background", km: "រូបថតកែរួច 12 សន្លឹក ផ្ទៃពណ៌ស" }, { en: "Two sizes: Facebook and delivery app", km: "ទំហំពីរ៖ Facebook និងកម្មវិធីដឹកជញ្ជូន" }, { en: "Delivered by Telegram or Drive", km: "ប្រគល់តាម Telegram ឬ Drive" }],
    category: "creative", categoryName: { en: "Creative & Marketing", km: "ច្នៃប្រឌិត និងទីផ្សារ" },
    budgetMin: 60, budgetMax: 100, deadline: { en: "Friday", km: "ថ្ងៃសុក្រ" }, remote: false, postedOn: "2027-02-02",
    quotes: [
      { provider: "dara-vann", price: 85, days: 2, note: { en: "Includes simple editing and two sizes for Facebook and the delivery app.", km: "រួមបញ្ចូលការកែសាមញ្ញ និងទំហំពីរសម្រាប់ Facebook និងកម្មវិធីដឹកជញ្ជូន។" } },
      { provider: "lina-sok", price: 60, days: 3, note: { en: "Phone photos plus three short clips for Reels.", km: "រូបថតដោយទូរស័ព្ទ បូកនឹងឃ្លីបខ្លីបីសម្រាប់ Reels។" } },
      { provider: "pisey-chan", price: 120, days: 1, note: { en: "Studio lighting brought to the cafe, two background options.", km: "យកពន្លឺស្ទូឌីយោមកហាង ជម្រើសផ្ទៃខាងក្រោយពីរ។" } },
    ],
    outcome: { acceptedProvider: "dara-vann", acceptedOn: "2027-02-03", completedOn: "2027-02-05", price: 85, delivered: { en: "12 edited photos in two sizes, delivered by Telegram", km: "រូបថតកែរួច 12 សន្លឹកក្នុងទំហំពីរ ប្រគល់តាម Telegram" } },
  },
  {
    id: "contract-translation",
    customer: { name: { en: "Bayon Logistics", km: "បាយ័ន ឡូជីស្ទិក" }, area: { en: "Sen Sok, Phnom Penh", km: "សែនសុខ ភ្នំពេញ" } },
    title: { en: "Translate a 6-page supplier contract, Khmer to English", km: "បកប្រែកិច្ចសន្យាអ្នកផ្គត់ផ្គង់ 6 ទំព័រ ពីខ្មែរទៅអង់គ្លេស" },
    details: { en: "Standard supply contract with payment terms and a penalty clause. We need an accurate English version for a foreign partner by Thursday.", km: "កិច្ចសន្យាផ្គត់ផ្គង់ស្តង់ដារ ជាមួយលក្ខខណ្ឌបង់ប្រាក់ និងប្រការពិន័យ។ យើងត្រូវការកំណែអង់គ្លេសត្រឹមត្រូវសម្រាប់ដៃគូបរទេសត្រឹមថ្ងៃព្រហស្បតិ៍។" },
    deliverables: [{ en: "English Word document, same layout", km: "ឯកសារ Word អង់គ្លេស ប្លង់ដូចគ្នា" }, { en: "List of terms that need a lawyer's check", km: "បញ្ជីពាក្យដែលត្រូវការការពិនិត្យពីមេធាវី" }],
    category: "documents", categoryName: { en: "Documents & Administration", km: "ឯកសារ និងរដ្ឋបាល" },
    budgetMin: 40, budgetMax: 70, deadline: { en: "Thursday", km: "ថ្ងៃព្រហស្បតិ៍" }, remote: true, postedOn: "2027-02-08",
    quotes: [{ provider: "sokha-lim", price: 55, days: 2, note: { en: "Includes a short glossary of legal terms and one revision round.", km: "រួមបញ្ចូលបញ្ជីពាក្យច្បាប់ខ្លី និងការកែម្តង។" } }],
  },
  {
    id: "inventory-sheet",
    customer: { name: { en: "Chea Mart", km: "ជា ម៉ាត" }, area: { en: "Chbar Ampov, Phnom Penh", km: "ច្បារអំពៅ ភ្នំពេញ" } },
    title: { en: "Excel inventory sheet for 300 products", km: "តារាងស្តុក Excel សម្រាប់ផលិតផល 300 មុខ" },
    details: { en: "We count stock on paper today. We want one sheet with products, suppliers, cost, sell price and a low-stock warning. Training for one staff member included.", km: "បច្ចុប្បន្នយើងរាប់ស្តុកលើក្រដាស។ យើងចង់បានតារាងមួយដែលមានផលិតផល អ្នកផ្គត់ផ្គង់ ថ្លៃដើម តម្លៃលក់ និងការព្រមានស្តុកទាប។ រួមបញ្ចូលការបង្រៀនបុគ្គលិកម្នាក់។" },
    deliverables: [{ en: "Excel file with 300 products entered", km: "ឯកសារ Excel ដែលបានបញ្ចូលផលិតផល 300 មុខ" }, { en: "Low-stock warning column", km: "ជួរឈរព្រមានស្តុកទាប" }, { en: "One hour of training at the shop", km: "ការបង្រៀនមួយម៉ោងនៅហាង" }],
    category: "documents", categoryName: { en: "Documents & Administration", km: "ឯកសារ និងរដ្ឋបាល" },
    budgetMin: 50, budgetMax: 90, deadline: { en: "Within two weeks", km: "ក្នុងរយៈពេលពីរសប្តាហ៍" }, remote: false, postedOn: "2027-02-09",
    quotes: [],
  },
];

export const providerBySlug = (slug: string) => providers.find((p) => p.slug === slug);
export const projectById = (id: string) => projects.find((p) => p.id === id);

/** The walkthrough tells the cafe story. */
export const story = projects[0];

// Workspace board posts. Three of the plan's four types; "hire shift" waits for legal clearance.
export type PostKind = "need_help" | "offer_skill" | "share_knowledge";
export type DemoPost = {
  id: string;
  kind: PostKind;
  author: { name: L; role: L; provider?: string };
  daysAgo: number;
  title: L;
  body: L;
  category: string;
  cheers: number;
  comments: number;
  project?: string; // need_help: the project it links to
};

export const posts: DemoPost[] = [
  {
    id: "p1", kind: "share_knowledge", author: { name: { en: "Dara Vann", km: "វ៉ាន់ ដារ៉ា" }, role: { en: "Product photographer", km: "អ្នកថតរូបផលិតផល" }, provider: "dara-vann" }, daysAgo: 0,
    title: { en: "Three phone settings for brighter menu photos", km: "ការកំណត់ទូរស័ព្ទបីយ៉ាងសម្រាប់រូបថតមុខម្ហូបភ្លឺជាងមុន" },
    body: { en: "Turn off HDR, lock exposure on the plate, and shoot near a window before 9am. Most cafes can do this themselves for daily specials; hire a photographer for the full menu.", km: "បិទ HDR ចាក់សោពន្លឺលើចាន ហើយថតជិតបង្អួចមុនម៉ោង 9 ព្រឹក។ ហាងកាហ្វេភាគច្រើនអាចធ្វើដោយខ្លួនឯងសម្រាប់មុខម្ហូបប្រចាំថ្ងៃ។ ជួលអ្នកថតរូបសម្រាប់មុខម្ហូបពេញ។" },
    category: "creative", cheers: 12, comments: 3,
  },
  {
    id: "p2", kind: "need_help", author: { name: { en: "Chea Mart", km: "ជា ម៉ាត" }, role: { en: "Minimart, Chbar Ampov", km: "មីនីម៉ាត ច្បារអំពៅ" } }, daysAgo: 1,
    title: { en: "Excel inventory sheet for 300 products", km: "តារាងស្តុក Excel សម្រាប់ផលិតផល 300 មុខ" },
    body: { en: "We count stock on paper today. Want one sheet with products, suppliers, cost, sell price and a low-stock warning, plus one hour of training.", km: "បច្ចុប្បន្នយើងរាប់ស្តុកលើក្រដាស។ ចង់បានតារាងមួយដែលមានផលិតផល អ្នកផ្គត់ផ្គង់ ថ្លៃដើម តម្លៃលក់ និងការព្រមានស្តុកទាប បូកនឹងការបង្រៀនមួយម៉ោង។" },
    category: "documents", cheers: 2, comments: 1, project: "inventory-sheet",
  },
  {
    id: "p3", kind: "offer_skill", author: { name: { en: "Sokha Lim", km: "លឹម សុខា" }, role: { en: "Khmer-English translator", km: "អ្នកបកប្រែខ្មែរ-អង់គ្លេស" }, provider: "sokha-lim" }, daysAgo: 1,
    title: { en: "Contract translation this week, two slots left", km: "បកប្រែកិច្ចសន្យាសប្តាហ៍នេះ នៅសល់ពីរកន្លែង" },
    body: { en: "Supplier and rental contracts, Khmer to English or back, from $8 per page with a glossary of legal terms. Remote, delivered as Word.", km: "កិច្ចសន្យាអ្នកផ្គត់ផ្គង់ និងជួល ពីខ្មែរទៅអង់គ្លេស ឬត្រឡប់ ចាប់ពី $8 ក្នុងមួយទំព័រ ជាមួយបញ្ជីពាក្យច្បាប់។ ពីចម្ងាយ ប្រគល់ជា Word។" },
    category: "documents", cheers: 5, comments: 0,
  },
  {
    id: "p4", kind: "need_help", author: { name: { en: "Sophea's Cafe", km: "ហាងកាហ្វេ សុភា" }, role: { en: "Cafe, Toul Kork", km: "ហាងកាហ្វេ ទួលគោក" } }, daysAgo: 2,
    title: { en: "Product photos for 12 menu items", km: "រូបថតផលិតផលសម្រាប់មុខម្ហូប 12 មុខ" },
    body: { en: "Clean photos of 12 drinks and cakes for Facebook and the delivery app. White background, two sizes, shooting before opening.", km: "រូបថតស្អាតនៃភេសជ្ជៈ និងនំ 12 មុខ សម្រាប់ Facebook និងកម្មវិធីដឹកជញ្ជូន។ ផ្ទៃពណ៌ស ទំហំពីរ ថតមុនបើកហាង។" },
    category: "creative", cheers: 4, comments: 2, project: "cafe-photos",
  },
  {
    id: "p5", kind: "share_knowledge", author: { name: { en: "Rithy Phan", km: "ផាន់ រិទ្ធី" }, role: { en: "IT support and websites", km: "ជំនួយ IT និងគេហទំព័រ" }, provider: "rithy-phan" }, daysAgo: 3,
    title: { en: "Before buying a POS, check the printer driver", km: "មុនទិញ POS សូមពិនិត្យកម្មវិធីបញ្ជាម៉ាស៊ីនបោះពុម្ព" },
    body: { en: "Half of my call-outs are kitchen printers that the POS app does not support. Ask the seller for the printer model list first.", km: "ពាក់កណ្តាលនៃការហៅខ្ញុំគឺម៉ាស៊ីនបោះពុម្ពផ្ទះបាយដែលកម្មវិធី POS មិនគាំទ្រ។ សូមសួរអ្នកលក់រកបញ្ជីម៉ូដែលម៉ាស៊ីនបោះពុម្ពជាមុនសិន។" },
    category: "technology", cheers: 9, comments: 4,
  },
  {
    id: "p6", kind: "offer_skill", author: { name: { en: "Lina Sok", km: "សុខ លីណា" }, role: { en: "Content creator", km: "អ្នកបង្កើតមាតិកា" }, provider: "lina-sok" }, daysAgo: 4,
    title: { en: "Weekend Reels package for cafes, $40", km: "កញ្ចប់ Reels ចុងសប្តាហ៍សម្រាប់ហាងកាហ្វេ $40" },
    body: { en: "Three short clips shot on a phone in one visit, captions in Khmer and English, ready to post. Student freelancer, Toul Kork and BKK.", km: "ឃ្លីបខ្លីបីថតដោយទូរស័ព្ទក្នុងការមកម្តង ចំណងជើងជាភាសាខ្មែរ និងអង់គ្លេស រួចរាល់សម្រាប់បង្ហោះ។ និស្សិតធ្វើការឯករាជ្យ ទួលគោក និងបឹងកេងកង។" },
    category: "creative", cheers: 7, comments: 1,
  },
];
