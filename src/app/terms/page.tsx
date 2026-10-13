import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { CONTACT_EMAIL } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Terms of use") };
}

const SECTIONS: [string, string[]][] = [
  [
    "What Piron Talent is",
    [
      "A place where people in Cambodia post work and checked providers send quotes. You agree the price with the provider and pay them directly. Piron Talent is not a party to the work and does not hold money."
    ]
  ],
  [
    "Accounts",
    [
      "One account per person. Keep your password private. You are responsible for what is posted from your account."
    ]
  ],
  [
    "Identity check",
    [
      "The Identity checked label means a Piron Talent staff member looked at an ID photo and a selfie. It is not a guarantee of skill, licence or conduct."
    ]
  ],
  [
    "Posts, quotes and jobs",
    [
      "Post only work that is legal in Cambodia. Quotes are offers; a job starts when the customer accepts one. Reviews can be written only after a confirmed job and must be honest."
    ]
  ],
  [
    "Problems",
    [
      "If something goes wrong, open a dispute on the job. Piron Talent staff will contact both sides and record an outcome, but cannot force payment or refunds."
    ]
  ],
  [
    "What we may do",
    [
      "We may remove posts, reviews or accounts that break these terms or the law, and we may change these terms with notice on this page."
    ]
  ],
  [
    "Contact",
    [
      "Piron Talent, Phnom Penh. Questions: {email}."
    ]
  ]
];

/** Plain-language terms text that matches how the app works today. Last reviewed 2026-10-13. */
export default async function TermsPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <PageTitle lead={t("The rules for using Piron Talent, in plain words.")}>{t("Terms of use")}</PageTitle>
      <div className="space-y-8">
        {SECTIONS.map(([heading, paras]) => (
          <section key={heading}>
            <h2 className="text-xl font-bold">{t(heading)}</h2>
            {paras.map((p) => (
              <p key={p} className="mt-2 leading-relaxed">
                {t(p, { email: CONTACT_EMAIL })}
              </p>
            ))}
          </section>
        ))}
        <p className="text-sm text-ink-muted">{t("Last updated: 13 October 2026")}</p>
      </div>
    </main>
  );
}
