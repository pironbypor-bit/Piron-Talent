/** Cities a provider can pick. Must match the check constraint in migration 0009. English is the i18n key. */
export const CITIES = ["Phnom Penh", "Siem Reap", "Battambang", "Sihanoukville", "Kampong Cham", "Kampot", "Other"] as const;
export type City = (typeof CITIES)[number];
export const isCity = (v: string | null | undefined): v is City => !!v && (CITIES as readonly string[]).includes(v);
/** Districts are kept only for Phnom Penh, where they matter for on-site work. */
export const HAS_DISTRICTS: City = "Phnom Penh";
