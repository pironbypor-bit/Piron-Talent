import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, FileText } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Post" };

/** Demo Post tab: choose what to post. The real app opens the post form directly. */
export default async function DemoPostChooser() {
  const t = await getT();
  const item = (href: string, Icon: typeof Briefcase, title: string, sub: string) => (
    <Link href={href} className="card flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800"><Icon className="size-5" /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="block text-sm text-ink-muted">{sub}</span></span>
    </Link>
  );
  return (
    <main className="space-y-3 px-4 py-4">
      <h1 className="text-xl font-bold">{t("Post")}</h1>
      {item("/demo/new-project", FileText, t("Post a project"), t("Describe the work, get quotes."))}
      {item("/demo/jobs", Briefcase, t("Post a job"), t("Part-time or freelance, under your name or a company."))}
    </main>
  );
}
