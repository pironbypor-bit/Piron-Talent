import type { L } from "@/lib/demo/fixtures";

// Extra sample data for the app preview (/demo/app). Nothing here is real.

export type JobType = "part_time" | "short_term" | "freelance" | "project";
export type DemoJob = {
  id: string;
  title: L;
  company: L;
  place: L;
  type: JobType;
  pay: string;
  payUnit: "per hour" | "per day" | "per project";
  when: L;
  tone: string;
};

export const JOB_TYPE_LABEL: Record<JobType, string> = { part_time: "Part-time", short_term: "Short-term", freelance: "Freelance", project: "Project based" };

export const jobs: DemoJob[] = [
  { id: "j1", title: { en: "Weekend cashier", km: "អ្នកគិតលុយចុងសប្តាហ៍" }, company: { en: "Brew & Beans Cafe", km: "ហាងកាហ្វេ Brew & Beans" }, place: { en: "BKK1, Phnom Penh", km: "បឹងកេងកង 1 ភ្នំពេញ" }, type: "part_time", pay: "$8", payUnit: "per hour", when: { en: "Sat to Sun, 9am to 5pm", km: "សៅរ៍ ដល់ អាទិត្យ ម៉ោង 9 ព្រឹក ដល់ 5 ល្ងាច" }, tone: "bg-brand-200" },
  { id: "j2", title: { en: "Event helpers (6)", km: "អ្នកជួយកម្មវិធី (6 នាក់)" }, company: { en: "Khmer Events Co.", km: "ក្រុមហ៊ុន Khmer Events" }, place: { en: "Diamond Island, Phnom Penh", km: "កោះពេជ្រ ភ្នំពេញ" }, type: "short_term", pay: "$50", payUnit: "per day", when: { en: "20 to 22 June", km: "20 ដល់ 22 មិថុនា" }, tone: "bg-stone-200" },
  { id: "j3", title: { en: "Data entry assistant", km: "ជំនួយការបញ្ចូលទិន្នន័យ" }, company: { en: "Angkor Solutions", km: "Angkor Solutions" }, place: { en: "Remote, Cambodia", km: "ពីចម្ងាយ កម្ពុជា" }, type: "freelance", pay: "$5 - $10", payUnit: "per hour", when: { en: "Ongoing", km: "បន្តបន្ទាប់" }, tone: "bg-brand-100" },
  { id: "j4", title: { en: "Product photography", km: "ថតរូបផលិតផល" }, company: { en: "LocalBrand Studio", km: "LocalBrand Studio" }, place: { en: "Phnom Penh", km: "ភ្នំពេញ" }, type: "project", pay: "$80", payUnit: "per project", when: { en: "Within one week", km: "ក្នុងរយៈពេលមួយសប្តាហ៍" }, tone: "bg-stone-300" },
];

/** Starting price per provider for the Services screen. */
export const RATES: Record<string, L> = {
  "dara-vann": { en: "$85 / set", km: "$85 / ឈុត" },
  "lina-sok": { en: "$40 / package", km: "$40 / កញ្ចប់" },
  "pisey-chan": { en: "$120 / set", km: "$120 / ឈុត" },
  "sokha-lim": { en: "$8 / page", km: "$8 / ទំព័រ" },
  "vanna-keo": { en: "$50 / sheet", km: "$50 / តារាង" },
  "rithy-phan": { en: "$25 / visit", km: "$25 / ដង" },
};

export const notifications: { icon: "quote" | "view" | "message" | "match"; title: L; body: L; daysAgo: number }[] = [
  { icon: "quote", title: { en: "New quote", km: "សម្រង់តម្លៃថ្មី" }, body: { en: "Dara Vann sent a quote for your menu photos.", km: "វ៉ាន់ ដារ៉ា បានផ្ញើសម្រង់តម្លៃសម្រាប់រូបថតមុខម្ហូបរបស់អ្នក។" }, daysAgo: 0 },
  { icon: "view", title: { en: "Your application was viewed", km: "ពាក្យសុំរបស់អ្នកត្រូវបានមើល" }, body: { en: "Brew & Beans Cafe, weekend cashier.", km: "ហាងកាហ្វេ Brew & Beans អ្នកគិតលុយចុងសប្តាហ៍។" }, daysAgo: 0 },
  { icon: "message", title: { en: "New message", km: "សារថ្មី" }, body: { en: "Dara Vann: Perfect. A window table...", km: "វ៉ាន់ ដារ៉ា៖ ល្អណាស់។ តុជិតបង្អួច..." }, daysAgo: 1 },
  { icon: "match", title: { en: "Job match", km: "ការងារដែលត្រូវគ្នា" }, body: { en: "Event helpers, Khmer Events Co.", km: "អ្នកជួយកម្មវិធី ក្រុមហ៊ុន Khmer Events។" }, daysAgo: 1 },
];

export const threads: { provider: string; last: L; time: string; unread: boolean }[] = [
  { provider: "dara-vann", last: { en: "Perfect. A window table and the white plates.", km: "ល្អណាស់។ តុជិតបង្អួច និងចានពណ៌ស។" }, time: "09:31", unread: true },
  { provider: "sokha-lim", last: { en: "I can start on the contract tomorrow morning.", km: "ខ្ញុំអាចចាប់ផ្តើមកិច្ចសន្យានៅព្រឹកស្អែក។" }, time: "Yesterday", unread: false },
  { provider: "rithy-phan", last: { en: "Printer driver installed, all working.", km: "បានដំឡើងកម្មវិធីបញ្ជាម៉ាស៊ីនបោះពុម្ព ដំណើរការទាំងអស់។" }, time: "Mon", unread: false },
];
