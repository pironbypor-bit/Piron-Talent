/** Every province and the capital of Cambodia, plus Other. Must match the check constraint in migration 0019. English is the i18n key. */
export const CITIES = [
  "Phnom Penh",
  "Siem Reap",
  "Battambang",
  "Sihanoukville",
  "Kampong Cham",
  "Kampot",
  "Banteay Meanchey",
  "Kampong Chhnang",
  "Kampong Speu",
  "Kampong Thom",
  "Kandal",
  "Kep",
  "Koh Kong",
  "Kratie",
  "Mondulkiri",
  "Oddar Meanchey",
  "Pailin",
  "Preah Vihear",
  "Prey Veng",
  "Pursat",
  "Ratanakiri",
  "Stung Treng",
  "Svay Rieng",
  "Takeo",
  "Tboung Khmum",
  "Other",
] as const;
export type City = (typeof CITIES)[number];
export const isCity = (v: string | null | undefined): v is City => !!v && (CITIES as readonly string[]).includes(v);
/** Districts are kept only for Phnom Penh, where they matter for on-site work. */
export const HAS_DISTRICTS: City = "Phnom Penh";

/** URL form of a city name: "Siem Reap" -> "siem-reap". "Other" has no page. */
export const citySlug = (c: string) => c.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const cityFromSlug = (s: string): City | null => CITIES.find((c) => c !== "Other" && citySlug(c) === s) ?? null;
