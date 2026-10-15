import Link from "next/link";
import { ArrowRight, Briefcase, LayoutDashboard } from "lucide-react";
import { BrandMark } from "@/components/brand";

/** What the owner sees after logging in: the marketplace app, or the owner-only control room. */
export function ChooseScreen({ name, appHref, spaceHref }: { name: string; appHref: string; spaceHref: string }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="flex items-center gap-2 font-bold tracking-tight">
        <BrandMark className="size-9" />
        Piron Work
      </div>
      <h1 className="mt-6 text-3xl font-bold">Welcome back, {name}</h1>
      <p className="mt-1 text-ink-muted">Where do you want to go?</p>

      <Link href={appHref} className="hero-amber mt-6 block rounded-3xl p-5 shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-600">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/90 text-brand-800"><Briefcase className="size-6" /></span>
        <span className="mt-3 block text-xl font-bold">Piron Work</span>
        <span className="mt-1 block text-sm text-brand-900">The marketplace. Posts, jobs, messages, payments, your profile.</span>
        <span className="mt-4 flex items-center gap-1 text-sm font-semibold">Open the app <ArrowRight className="size-4" /></span>
      </Link>

      <Link href={spaceHref} className="mt-4 block rounded-3xl bg-ink p-5 text-white shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-400">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10"><LayoutDashboard className="size-6" /></span>
        <span className="mt-3 flex items-center gap-2 text-xl font-bold">
          Piron Work Space
          <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-ink">Owner only</span>
        </span>
        <span className="mt-1 block text-sm text-stone-300">The control room. Numbers, things waiting for you, system status.</span>
        <span className="mt-4 flex items-center gap-1 text-sm font-semibold">Open the Space <ArrowRight className="size-4" /></span>
      </Link>
    </main>
  );
}
