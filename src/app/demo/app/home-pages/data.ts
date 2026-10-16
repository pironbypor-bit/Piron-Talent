// Sample data for the Home in three pages demo. Nothing here is real.

export type Pro = { id: string; name: string; icon: string; services: string; rating: number; reviews: number; city: string; price: number; unit: string; kind: "person" | "company"; checked: boolean; now: boolean; category: string };

export const PROS: Pro[] = [
  { id: "p1", name: "Sokha Electrical", icon: "🧑‍🔧", services: "Home wiring · Lighting · Fans", rating: 4.9, reviews: 46, city: "Phnom Penh", price: 15, unit: "from", kind: "person", checked: true, now: true, category: "Maintenance and repairs" },
  { id: "p2", name: "Srey Mom Beauty", icon: "💇‍♀️", services: "Hair styling · Makeup · Events", rating: 4.8, reviews: 38, city: "Phnom Penh", price: 12, unit: "from", kind: "person", checked: true, now: false, category: "Beauty" },
  { id: "p3", name: "Dara AC Service", icon: "🧰", services: "AC cleaning · Appliance maintenance", rating: 4.9, reviews: 52, city: "Phnom Penh", price: 18, unit: "from", kind: "company", checked: true, now: true, category: "Maintenance and repairs" },
  { id: "p4", name: "Malis Cleaning", icon: "🧹", services: "Home cleaning · Office cleaning", rating: 4.7, reviews: 24, city: "Siem Reap", price: 10, unit: "from", kind: "company", checked: false, now: true, category: "Cleaning" },
  { id: "p5", name: "Rith Photography", icon: "📷", services: "Events · Portraits · Product photos", rating: 4.9, reviews: 19, city: "Phnom Penh", price: 35, unit: "from", kind: "person", checked: false, now: false, category: "Creative" },
  { id: "p6", name: "Vanna Plumbing", icon: "🔧", services: "Plumbing · Pumps · Pipe repairs", rating: 4.8, reviews: 31, city: "Kandal", price: 16, unit: "from", kind: "person", checked: true, now: true, category: "Maintenance and repairs" },
];

export const POSTS = [
  { id: "a", kind: "Job offer", title: "Menu design for a new cafe", body: "Need a printed menu for 12 drinks. English and Khmer. Photos provided.", who: "Piron", when: "2 hours ago", budget: "$30 - $60" },
  { id: "b", kind: "Skill offer", title: "Bookkeeping for small shops", body: "Monthly books, receipts and a simple report for your owner.", who: "Chenda", when: "Yesterday", budget: "from $20" },
  { id: "c", kind: "Share knowledge", title: "How to price a logo job", body: "Three questions to ask before you send a quote so you do not work for free.", who: "POR", when: "2 days ago", budget: "" },
];

export type Row = { id: string; type: "booking" | "application" | "quote"; role: "customer" | "provider"; title: string; who: string; when: string; status: "Waiting" | "Active" | "Done" | "Cancelled"; label: string };

export const ROWS: Row[] = [
  { id: "r1", type: "booking", role: "customer", title: "AC cleaning, 2 units", who: "Dara AC Service", when: "Sat 24 Oct, 09:00", status: "Waiting", label: "Waiting for the provider" },
  { id: "r2", type: "booking", role: "customer", title: "Wedding portraits", who: "Rith Photography", when: "Sun 8 Nov", status: "Active", label: "Agreed at $120" },
  { id: "r3", type: "booking", role: "provider", title: "Fix a ceiling fan", who: "Sophea (customer)", when: "Fri 23 Oct, 14:00", status: "Waiting", label: "Needs your answer" },
  { id: "r4", type: "application", role: "customer", title: "Weekend barista shift", who: "Sunrise Cafe", when: "Applied 12 Oct", status: "Waiting", label: "Submitted" },
  { id: "r5", type: "application", role: "customer", title: "Event helper, Water Festival", who: "City Events", when: "Applied 3 Oct", status: "Done", label: "Accepted" },
  { id: "r6", type: "quote", role: "provider", title: "Logo refresh for a cafe", who: "Piron (customer)", when: "Quote sent 10 Oct", status: "Done", label: "Job confirmed" },
  { id: "r7", type: "booking", role: "customer", title: "House cleaning", who: "Malis Cleaning", when: "Mon 5 Oct", status: "Cancelled", label: "You cancelled" },
];
