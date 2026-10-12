import type { L } from "@/lib/demo/fixtures";

// Sample business for /demo/business. Nobody here is real.
export type Member = { name: L; role: "owner" | "manager" | "member"; email: string };
export type BizJob = { id: string; title: L; postedBy: string; provider: string; price: number; month: string; status: "done" | "in_progress" | "quotes" | "open"; projectId?: string };

export const business = {
  name: { en: "Sophea's Cafe", km: "ហាងកាហ្វេ សុភា" },
  plan: { en: "Business, trial", km: "អាជីវកម្ម សាកល្បង" },
  city: { en: "Toul Kork, Phnom Penh", km: "ទួលគោក ភ្នំពេញ" },
  members: [
    { name: { en: "Sophea Mao", km: "ម៉ៅ សុភា" }, role: "owner", email: "sophea@example.com" },
    { name: { en: "Vuthy Chan", km: "ចាន់ វុទ្ធី" }, role: "manager", email: "vuthy@example.com" },
    { name: { en: "Dalin Sok", km: "សុខ ដាលីន" }, role: "member", email: "dalin@example.com" },
  ] as Member[],
  jobs: [
    { id: "menu-board", title: { en: "Menu board design", km: "ការរចនាក្តារមុខម្ហូប" }, postedBy: "Sophea Mao", provider: "dara-vann", price: 70, month: "2026-12", status: "done" },
    { id: "pos-setup", title: { en: "POS and kitchen printer setup", km: "ដំឡើង POS និងម៉ាស៊ីនបោះពុម្ពផ្ទះបាយ" }, postedBy: "Vuthy Chan", provider: "rithy-phan", price: 45, month: "2027-01", status: "done" },
    { id: "cafe-photos", title: { en: "Product photos for 12 menu items", km: "រូបថតផលិតផលសម្រាប់មុខម្ហូប 12 មុខ" }, postedBy: "Sophea Mao", provider: "dara-vann", price: 85, month: "2027-02", status: "done", projectId: "cafe-photos" },
    { id: "staff-forms", title: { en: "Staff contract and leave form templates", km: "គំរូកិច្ចសន្យាបុគ្គលិក និងទម្រង់សុំច្បាប់" }, postedBy: "Vuthy Chan", provider: "sokha-lim", price: 40, month: "2027-02", status: "in_progress" },
    { id: "inventory-sheet", title: { en: "Excel inventory sheet for 300 products", km: "តារាងស្តុក Excel សម្រាប់ផលិតផល 300 មុខ" }, postedBy: "Dalin Sok", provider: "", price: 0, month: "2027-02", status: "open", projectId: "inventory-sheet" },
  ] as BizJob[],
};

export const MONTHS: { key: string; label: L }[] = [
  { key: "2026-09", label: { en: "Sep", km: "កញ្ញា" } },
  { key: "2026-10", label: { en: "Oct", km: "តុលា" } },
  { key: "2026-11", label: { en: "Nov", km: "វិច្ឆិកា" } },
  { key: "2026-12", label: { en: "Dec", km: "ធ្នូ" } },
  { key: "2027-01", label: { en: "Jan", km: "មករា" } },
  { key: "2027-02", label: { en: "Feb", km: "កុម្ភៈ" } },
];
