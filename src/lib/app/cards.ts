import type { ProviderCard } from "./types";

// A professional card is made from the profile. Anything the person edited (provider_cards) replaces the profile value.

type CardSource = {
  display_name: string;
  role_line: string | null;
  city: string | null;
  district?: string | null;
  price_from: string | null;
  skills: string[];
  card?: ProviderCard | null;
};

export type ResolvedCard = { name: string; services: string; price: string; city: string; about: string | null; missing: ("services" | "city" | "price")[]; complete: boolean };

export function resolveCard(p: CardSource & { bio?: string | null }): ResolvedCard {
  const c = p.card ?? null;
  const fromSkills = p.skills.slice(0, 3).join(" · ");
  const services = (c?.services ?? "").trim() || fromSkills || (p.role_line ?? "").trim();
  const price = (c?.price_from ?? "").trim() || (p.price_from ?? "").trim();
  const city = (c?.city ?? "").trim() || (p.city ?? "").trim();
  const missing: ResolvedCard["missing"] = [];
  if (!services) missing.push("services");
  if (!city) missing.push("city");
  if (!price) missing.push("price");
  return {
    name: (c?.title ?? "").trim() || p.display_name,
    services,
    price,
    city,
    about: (c?.about ?? "").trim() || (p.bio ?? "").trim() || null,
    missing,
    complete: missing.length === 0,
  };
}
