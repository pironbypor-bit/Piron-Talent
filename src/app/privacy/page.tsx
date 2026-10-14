import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import { CONTACT_EMAIL } from "@/lib/brand";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Privacy") };
}

const SECTIONS: [string, string[]][] = [
  [
    "What we collect",
    [
      "Your name, email, phone or Telegram, city and what you post in the app.",
      "If you ask for an identity check: the ID photo, selfie, legal name, ID number and date of birth. Only Piron Work staff can see these, and they are never shown on your profile."
    ]
  ],
  [
    "How we use it",
    [
      "To match requests with providers, to show your public profile, to send notifications about quotes, messages and jobs, and to answer your questions.",
      "We do not sell your data and we do not show ads."
    ]
  ],
  [
    "Who can see what",
    [
      "Your public profile shows your display name, role, city, skills, portfolio, completed jobs and reviews.",
      "Quotes are private between you and the other side. Messages are private to the conversation.",
      "Reports and disputes are seen by the two sides and Piron Work staff."
    ]
  ],
  [
    "Where it is stored",
    [
      "Data is stored with Supabase in Singapore and served through Cloudflare. Emails are sent through Brevo."
    ]
  ],
  [
    "Your choices",
    [
      "You can edit your profile, turn off email notifications in Settings, and ask us to delete your account by writing to {email}. Identity photos are deleted on request."
    ]
  ],
  [
    "Contact",
    [
      "Piron Work, Phnom Penh. Questions about privacy: {email}."
    ]
  ]
];

/** Plain-language privacy text that matches how the app works today. Last reviewed 2026-10-13. */
export default async function PrivacyPage() {
  const t = await getT();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <PageTitle lead={t("What we collect, why, and who can see it.")}>{t("Privacy")}</PageTitle>
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
