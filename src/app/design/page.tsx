import Link from "next/link";

/** Internal notes for the owner: what the homepage must do, and how A and B differ. English only. */
export default function DesignIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Homepage proposals</h1>
      <p className="mt-3 text-ink-muted">Both pages use the real brand tokens, fonts and Khmer copy. Switch language in the header. Open on a phone too.</p>

      <h2 className="mt-10 text-xl font-bold">What the homepage must show</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
        <li>Who it is for and what it does, in one Khmer sentence, above the fold.</li>
        <li>Two paths: post a project (the paying side, the plan&apos;s first audience) and join as a provider.</li>
        <li>What happens next and how fast: one working day, two or three quotes, pay the provider directly.</li>
        <li>Trust, stated precisely: identity checked, completed jobs counted, reviews only after work. Never &quot;licensed&quot; or &quot;guaranteed&quot;.</li>
        <li>Proof with prices: example projects with real budgets, labelled sample until the pilot produces real ones.</li>
        <li>The four launch categories, and that more open later.</li>
        <li>Four honest questions: cost, speed, who the providers are, what if something goes wrong.</li>
        <li>The pilot note: Phnom Penh only, first 20 projects matched by hand.</li>
      </ol>

      <h2 className="mt-10 text-xl font-bold">The two proposals</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Link href="/design/home-a" className="rounded-2xl border border-stone-200 p-5 hover:border-brand-400">
          <p className="text-lg font-bold">A: project first</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            The page is a request box. Example projects with prices sit right under it. Providers get a smaller block near the end. Best when most visitors
            arrive from Facebook posts aimed at shop owners.
          </p>
        </Link>
        <Link href="/design/home-b" className="rounded-2xl border border-stone-200 p-5 hover:border-brand-400">
          <p className="text-lg font-bold">B: two doors</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            One headline speaks to both sides, then two equal doors with three steps each, sample provider profiles, districts. Best when the same page must
            recruit providers at campus events and win customers.
          </p>
        </Link>
      </div>

      <h2 className="mt-10 text-xl font-bold">Recommendation</h2>
      <p className="mt-3 leading-relaxed">
        Use A as the public homepage during the pilot, because paid demand comes first in the plan and the request box turns a visit into a request in
        one step. Keep B&apos;s provider door as the /join landing page for campus and TikTok recruitment, where the audience is providers only.
      </p>
    </main>
  );
}
