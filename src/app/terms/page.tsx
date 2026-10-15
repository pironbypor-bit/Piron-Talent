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
    "What Piron Work is",
    [
      "A place where people in Cambodia post work and checked providers send quotes. You agree the price with the provider and pay them directly. Piron Work is not a party to the work and does not hold money."
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
      "The Identity checked label means a Piron Work staff member looked at an ID photo and a selfie. It is not a guarantee of skill, licence or conduct."
    ]
  ],
  [
    "Posts, quotes and jobs",
    [
      "Post only work that is legal in Cambodia. Quotes are offers; a job starts when the customer accepts one. Reviews can be written only after a confirmed job and must be honest."
    ]
  ],
  [
    "Invoices and payment records",
    [
      "Invoices and payment records in the app are records of what the two sides agreed. They are not tax invoices. Piron Work does not take, hold or move money. Marking a payment as paid or as received is a statement by the person who marks it."
    ]
  ],
  [
    "Companies and files",
    [
      "A company owner decides what is public on the company page and who can see each file. Do not publish ID numbers, bank details or private information. Piron Work does not guarantee any company or file."
    ]
  ],
  [
    "Team records",
    [
      "Shifts, tasks, hours, terms and pay records are the company's own records. They are not employment or tax advice, and Piron Work does not calculate or pay wages or taxes."
    ]
  ],
  [
    "Volunteer activities",
    [
      "Organisers need a checked identity. Piron Work does not supervise activities, so use your own judgement about where and with whom you take part."
    ]
  ],
  [
    "Payout accounts",
    [
      "A verified payout account only means that a staff member compared the account holder name with the ID. It is not a guarantee about the person."
    ]
  ],
  [
    "Problems",
    [
      "If something goes wrong, open a dispute on the job. Piron Work staff will contact both sides and record an outcome, but cannot force payment or refunds."
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
      "Piron Work, Phnom Penh. Questions: {email}."
    ]
  ]
];

/** Plain-language terms text that matches how the app works today. Last reviewed 2026-10-16. */
export default async function TermsPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <PageTitle lead={t("The rules for using Piron Work, in plain words.")}>{t("Terms of use")}</PageTitle>
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
        <p className="text-sm text-ink-muted">{t("Last updated: 16 October 2026")}</p>
      </div>
    </main>
  );
}
