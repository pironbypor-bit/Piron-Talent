import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pick, projectById, projects } from "@/lib/demo/fixtures";
import { getLocale } from "@/lib/i18n/server";
import { ProjectView } from "./project-view";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  const p = projectById(id);
  return { title: p ? pick(p.title, locale) : "Demo" };
}

export default async function DemoProjectPage({ params }: Props) {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  const project = projectById(id);
  if (!project) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <ProjectView project={project} locale={locale} />
    </main>
  );
}
