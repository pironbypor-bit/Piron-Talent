import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, Pill } from "@/components/ui";
import { EmptyIllustration } from "@/components/illustrations";
import { myJobs } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("My jobs") };
}

const LABEL: Record<string, string> = { accepted: "In progress", delivered: "Work delivered", confirmed: "Completed", cancelled: "Cancelled" };
const TONE: Record<string, "amber" | "green" | "neutral" | "red"> = { accepted: "amber", delivered: "amber", confirmed: "green", cancelled: "red" };

/** Jobs I am part of, as customer or provider, linking back to the project page where the actions live. */
export default async function MyJobsPage() {
  const [t, locale, jobs] = await Promise.all([getT(), getLocale(), myJobs()]);
  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/profile" className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{t("My jobs")}</h1>
      {jobs.length === 0 ? (
        <div className="mt-4">
          <EmptyState illustration={<EmptyIllustration kind="jobs" />}>{t("Nothing yet.")}</EmptyState>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {jobs.map((j) => {
            const other = j.mine === "customer" ? j.provider : j.customer;
            return (
              <li key={j.id} className="card p-3">
                <Link href={`/app/post/${j.post_id}`} className="block font-semibold hover:underline">
                  {j.title}
                </Link>
                <div className="mt-2 flex items-center gap-3">
                  <AvatarImg name={other.display_name} url={other.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{other.display_name}</p>
                    <p className="text-xs text-ink-muted">
                      {t(j.mine === "customer" ? "As customer" : "As provider")} · {formatDate(j.created_at, locale)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${j.agreed_price}</p>
                    <Pill tone={TONE[j.status]}>{t(LABEL[j.status])}</Pill>
                    {j.mine === "customer" && j.status === "confirmed" && (
                      <Link href={`/app/post/new?rehire=${j.post_id}&to=${j.provider_id}`} className="mt-1 block text-sm font-medium underline">
                        {t("Hire again")}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
