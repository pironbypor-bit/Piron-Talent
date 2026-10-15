// Sample choices for the two dropdown demos. Nothing is saved.

export type Opt = { value: string; label: string; hint?: string };

export const FILTERS: Opt[] = [
  { value: "all", label: "All posts", hint: "Everything, newest first" },
  { value: "need_help", label: "Job offer", hint: "Someone needs a hand" },
  { value: "offer_skill", label: "Skill offer", hint: "Someone offers a skill" },
  { value: "share_knowledge", label: "Share knowledge", hint: "Tips and know-how" },
];

export const CATEGORIES: Opt[] = [
  { value: "design", label: "Design and logos" },
  { value: "web", label: "Websites and apps" },
  { value: "photo", label: "Photo and video" },
  { value: "writing", label: "Writing and translation" },
  { value: "finance", label: "Finance and accounting" },
  { value: "legal", label: "Legal and documents" },
  { value: "teaching", label: "Teaching and tutoring" },
  { value: "repairs", label: "Repairs and building" },
  { value: "delivery", label: "Delivery and errands" },
  { value: "events", label: "Events and catering" },
  { value: "beauty", label: "Beauty and wellness" },
  { value: "other", label: "Something else" },
];

export const CITIES: Opt[] = [
  { value: "pp", label: "Phnom Penh" },
  { value: "sr", label: "Siem Reap" },
  { value: "bb", label: "Battambang" },
  { value: "sv", label: "Sihanoukville" },
  { value: "kp", label: "Kampot" },
  { value: "kc", label: "Kampong Cham" },
];

export const JOB_TYPES: Opt[] = [
  { value: "freelance", label: "Freelance", hint: "One project, your own hours" },
  { value: "part", label: "Part-time", hint: "A few days a week" },
  { value: "full", label: "Full-time", hint: "A regular job" },
  { value: "oneoff", label: "One-off task", hint: "A single small job" },
];

export const MENU: Opt[] = [
  { value: "notifications", label: "Notifications", hint: "7 new" },
  { value: "settings", label: "Settings", hint: "Language, alerts, privacy" },
  { value: "logout", label: "Log out" },
];
