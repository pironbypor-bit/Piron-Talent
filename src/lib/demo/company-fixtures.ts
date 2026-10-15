// Sample data for the company page and documents demo (/demo/app/company).
// Nothing here is real and none of it is stored. It shows what an owner, a manager, a member and a visitor would see.

export type Level = "private" | "team" | "public";
export type Doc = { id: string; name: string; kind: "pdf" | "image"; size: string; updated: string; level: Level };

export const initialDocs: Doc[] = [
  { id: "d1", name: "Menu and price list.pdf", kind: "pdf", size: "420 KB", updated: "12 Oct", level: "public" },
  { id: "d2", name: "Cafe photos.jpg", kind: "image", size: "1.8 MB", updated: "3 Oct", level: "public" },
  { id: "d3", name: "Staff handbook.pdf", kind: "pdf", size: "310 KB", updated: "28 Sep", level: "team" },
  { id: "d4", name: "Opening hours poster.png", kind: "image", size: "640 KB", updated: "20 Sep", level: "team" },
  { id: "d5", name: "Business registration.pdf", kind: "pdf", size: "980 KB", updated: "14 Aug", level: "private" },
  { id: "d6", name: "Supplier contract.pdf", kind: "pdf", size: "250 KB", updated: "2 Aug", level: "private" },
];

export type Viewer = { id: string; label: string; role: "owner" | "manager" | "member" | "visitor" };
export const viewers: Viewer[] = [
  { id: "sophea", label: "Owner: Sophea", role: "owner" },
  { id: "dara", label: "Manager: Dara", role: "manager" },
  { id: "srey", label: "Member: Srey", role: "member" },
  { id: "visitor", label: "Visitor, not logged in", role: "visitor" },
];

export type Activity = { id: string; kind: "project" | "job" | "activity" | "invite"; title: string; meta: string; when: string };
export const activity: Activity[] = [
  { id: "a1", kind: "job", title: "Part-time barista, weekends", meta: "Phnom Penh · $2.50 per hour", when: "Posted 2 days ago" },
  { id: "a2", kind: "project", title: "New menu design, two pages", meta: "Budget $40 to $60 · 5 quotes", when: "Posted 5 days ago" },
  { id: "a3", kind: "activity", title: "Street clean-up in front of the cafe", meta: "Sat 18 Oct, 07:00 · 8 of 12 places taken", when: "Organised by Sophea Café" },
  { id: "a4", kind: "invite", title: "Invited: photographers for food photos", meta: "Open to providers in Creative", when: "Sent 1 week ago" },
];
