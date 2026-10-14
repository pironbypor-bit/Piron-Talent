// Fixtures for the two profile demos (/demo/app/profile-a and /demo/app/profile-b): one person with every hat on.
// Labels that need Khmer are English i18n keys; titles are plain demo text.

export const person = { name: "Sophea", roleLine: "Logo designer", identity: true, rating: 4.9, reviews: 11, completed: 12, city: "Phnom Penh" };

export type Company = { id: string; name: string; kind: string; city: string; team: number };
export const companies: Company[] = [
  { id: "cafe", name: "Sophea Café", kind: "Café", city: "Phnom Penh", team: 2 },
  { id: "studio", name: "SP Design Studio", kind: "Design studio", city: "Phnom Penh", team: 1 },
];

export type Opening = { title: string; type: "Part-time" | "Project"; pay: string; applicants: number; status: "Open" | "Draft" };
export const openings: Record<string, Opening[]> = {
  cafe: [
    { title: "Barista, weekends", type: "Part-time", pay: "$3/h", applicants: 2, status: "Open" },
    { title: "Cashier, evenings", type: "Part-time", pay: "$2.5/h", applicants: 1, status: "Open" },
  ],
  studio: [{ title: "Product photos for a menu", type: "Project", pay: "$120", applicants: 2, status: "Open" }],
};

export const requests = [
  { title: "Fix the kitchen tap", status: "3 quotes", days: 1 },
  { title: "Logo for my shop", status: "In progress", days: 6 },
];

export const applications = [
  { title: "Graphic designer, part-time", company: "Brown Coffee", status: "Sent" },
  { title: "Menu design", company: "Noodle House", status: "Shortlisted" },
];

export const alerts = ["Creative", "Phnom Penh"];

export const portfolio = [
  { caption: "Café logo", tone: "bg-amber-200" },
  { caption: "Menu board", tone: "bg-sky-200" },
  { caption: "Shop sign", tone: "bg-emerald-200" },
];

export const counts = (id: string) => {
  const o = openings[id] ?? [];
  return { jobs: o.filter((x) => x.type === "Part-time").length, projects: o.filter((x) => x.type === "Project").length, applicants: o.reduce((n, x) => n + x.applicants, 0) };
};
