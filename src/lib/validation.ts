import { z } from "zod";

// Messages are English keys for t(); the form component translates them.
const text = (min: number, max: number) => z.string().trim().min(min, min <= 1 ? "Please fill in this field." : "Too short.").max(max, "Too long.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Too long.")
    .transform((v) => (v === "" ? null : v));

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(/,/g, ""))),
    z.number({ error: "Must be a number." }).min(min, "Must be a number.").max(max, "Too long.").nullable(),
  );

const categoryId = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().positive().nullable(),
);

/** Bots fill every field; people never see this one. */
const honeypot = z.string().max(0, "Not allowed.");

export const projectRequestSchema = z
  .object({
    contact_name: text(1, 120),
    contact: text(3, 120),
    business_name: optionalText(120),
    category_id: categoryId,
    details: text(10, 3000),
    budget_min: optionalNumber(0, 1_000_000),
    budget_max: optionalNumber(0, 1_000_000),
    needed_by: optionalText(120),
    website: honeypot,
  })
  .refine((d) => d.budget_max === null || d.budget_min === null || d.budget_max >= d.budget_min, {
    path: ["budget_max"],
    message: "Must not be lower than the first amount.",
  });

export const providerApplicationSchema = z.object({
  full_name: text(1, 120),
  contact: text(3, 120),
  city: text(1, 80),
  category_id: categoryId,
  skills: text(2, 1000),
  experience_years: optionalNumber(0, 60),
  portfolio_url: z
    .string()
    .trim()
    .max(300, "Too long.")
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v) || /^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v), "Must be a valid link."),
  website: honeypot,
});

export const credentialsSchema = z.object({
  email: z.email("Please fill in this field."),
  password: z.string().min(8, "At least 8 characters").max(200, "Too long."),
});

export const signupSchema = credentialsSchema.extend({
  display_name: text(1, 80),
});

export type FormState = {
  ok: boolean;
  /** Field name -> first error text (an English key for t()). */
  errors?: Record<string, string>;
  /** Entered values, echoed back so the form keeps them after an error. */
  values?: Record<string, string>;
  /** A general message (an English key for t()). */
  message?: string;
};

export const idle: FormState = { ok: false };

/** Turns a zod failure into the per-field map the forms show. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export const formEntries = (fd: FormData, keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, (fd.get(k) ?? "") as string]));
