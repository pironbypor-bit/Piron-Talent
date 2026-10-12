import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getLocale, getT } from "@/lib/i18n/server";
import { projectById, providerBySlug } from "@/lib/demo/fixtures";
import { NewProjectForm } from "./new-project-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("New project") };
}

type Props = { searchParams: Promise<{ rehire?: string; provider?: string }> };

/** Plain form, or the one-tap rehire: the old project and the provider come from the query string and the form opens filled in. */
export default async function DemoNewProjectPage({ searchParams }: Props) {
  const [t, locale, { rehire, provider }] = await Promise.all([getT(), getLocale(), searchParams]);
  const again = rehire ? projectById(rehire) : undefined;
  const to = provider ? providerBySlug(provider) : undefined;
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <PageTitle lead={again ? t("Same scope as last time. Change anything, then send.") : t("Describe one project clearly and providers can quote without back-and-forth.")}>
        {again ? t("Hire again") : t("New project")}
      </PageTitle>
      <NewProjectForm locale={locale} rehire={again ? { project: again, provider: to ?? providerBySlug(again.outcome?.acceptedProvider ?? "") } : undefined} />
    </main>
  );
}
