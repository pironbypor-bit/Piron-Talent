import type { T } from "@/lib/i18n/core";

/** Blocks both proposals share, so the comparison is about structure and tone, not about these. */

export function TrustBlock({ t }: { t: T }) {
  const items = [t("Identity checked before the first job"), t("Completed jobs counted, not claimed"), t("Reviews only after completed work")];
  return (
    <section className="rounded-2xl border border-stone-200 p-6">
      <h2 className="text-xl font-bold">{t("What we check")}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <span className="mt-1 size-2.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
            <span className="text-sm leading-relaxed">{x}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Faq({ t }: { t: T }) {
  const qa: [string, string][] = [
    [t("How much does it cost?"), t("Posting a project is free. You agree a price with the provider and pay them directly.")],
    [t("How fast?"), t("We reply within one working day with two or three suitable providers.")],
    [t("Who are the providers?"), t("Freelancers and small studios in Phnom Penh. We check identity and record each completed job. We do not verify professional licences.")],
    [t("What if something goes wrong?"), t("Tell us. During the pilot a person from Piron Talent follows every job and helps both sides agree.")],
  ];
  return (
    <section>
      <h2 className="text-2xl font-bold">{t("Questions")}</h2>
      <dl className="mt-4 divide-y divide-stone-200 rounded-2xl border border-stone-200">
        {qa.map(([q, a]) => (
          <div key={q} className="px-5 py-4">
            <dt className="font-semibold">{q}</dt>
            <dd className="mt-1 leading-relaxed text-ink-muted">{a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PilotNote({ t }: { t: T }) {
  return (
    <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
      <span className="font-semibold">{t("Pilot programme, 2027")}.</span> {t("First 20 projects are matched by hand by the Piron Talent team.")} {t("Phnom Penh only for now.")}
    </p>
  );
}
