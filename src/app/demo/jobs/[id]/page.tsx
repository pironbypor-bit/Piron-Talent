import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projectById, projects } from "@/lib/demo/fixtures";
import { getLocale, getT } from "@/lib/i18n/server";
import { JobView } from "./job-view";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Job timeline") };
}

export default async function DemoJobPage({ params }: Props) {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  const project = projectById(id);
  if (!project) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <JobView project={project} locale={locale} />
    </main>
  );
}
