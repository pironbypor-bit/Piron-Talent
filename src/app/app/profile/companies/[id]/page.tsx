import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, ChevronRight, FileText, LogOut, MessageCircle, X } from "lucide-react";
import { Button, EmptyState, Pill } from "@/components/ui";
import { inviteToBusiness, openBusinessChat, removeBusinessMember, setBusinessRole } from "@/lib/app/actions";
import { getBusiness, getMe, groupCandidates } from "@/lib/app/queries";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../../avatar";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = await getBusiness(id);
  return { title: b?.name ?? "Company" };
}

/** One company: details, its openings (owner and managers), the team with roles, invitations and the team chat. */
export default async function CompanyPage({ params }: Props) {
  const [{ id }, t, locale, me] = await Promise.all([params, getT(), getLocale(), getMe()]);
  const b = await getBusiness(id);
  if (!b || !me) notFound();
  const isOwner = b.role === "owner";
  const manager = b.role === "owner" || b.role === "manager";
  const inTeam = new Set(b.team.map((m) => m.user_id));
  const candidates = manager && b.team.length < 20 ? (await groupCandidates()).filter((p) => !inTeam.has(p.id)) : [];
  const btn = "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold";
  const ROLE = { owner: "Owner", manager: "Manager", member: "Member" } as const;

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/profile" className="text-sm font-medium underline">{t("Back")}</Link>
      <section className="card mt-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold">{b.name}</h1>
          {!isOwner && <Pill>{t(ROLE[b.role])}</Pill>}
        </div>
        <p className="text-sm text-ink-muted">{[b.description, b.city ? t(b.city) : null].filter(Boolean).join(" · ") || t("Company")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {manager && <Link href={`/app/jobs/new?business=${b.id}`} className={`${btn} bg-brand-500 text-ink hover:bg-brand-400`}><Briefcase className="size-4" />{t("Post a job")}</Link>}
          {manager && <Link href={`/app/post/new?business=${b.id}`} className={`${btn} border border-stone-300 bg-white hover:bg-brand-50`}><FileText className="size-4" />{t("Post a project")}</Link>}
          <form action={openBusinessChat.bind(null, b.id)}>
            <button type="submit" className={`${btn} border border-stone-300 bg-white hover:bg-brand-50`}><MessageCircle className="size-4" />{t("Team chat")}</button>
          </form>
        </div>
      </section>

      {manager && (
        <>
          <h2 className="mt-5 text-sm font-semibold text-ink-muted">{t("Openings")} · {b.jobs.length} {t("part-time")} · {b.posts.length} {t("projects")}</h2>
          {b.jobs.length + b.posts.length === 0 ? (
            <div className="mt-2"><EmptyState>{t("Nothing posted under this company yet.")}</EmptyState></div>
          ) : (
            <ul className="card mt-2 divide-y divide-stone-100">
              {b.jobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/app/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{j.title}</span>
                      <span className="block text-xs text-ink-muted">{t(j.job_type === "freelance" ? "Freelance" : "Project based")} · {formatDate(j.created_at, locale)}</span>
                    </span>
                    <Pill tone={j.applicants > 0 ? "amber" : "neutral"}>{t("{n} applicants", { n: j.applicants })}</Pill>
                    <ChevronRight className="size-4 text-ink-muted" />
                  </Link>
                </li>
              ))}
              {b.posts.map((p) => (
                <li key={p.id}>
                  <Link href={`/app/post/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.title}</span>
                      <span className="block text-xs text-ink-muted">{t("Project")} · {formatDate(p.created_at, locale)}</span>
                    </span>
                    <ChevronRight className="size-4 text-ink-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <h2 className="mt-5 text-sm font-semibold text-ink-muted">{t("Team")} · {b.team.length}</h2>
      <ul className="card mt-2 divide-y divide-stone-100">
        {b.team.map((m) => (
          <li key={m.user_id} className="flex items-center gap-3 px-4 py-2.5">
            <AvatarImg name={m.display_name} url={m.avatar_url} />
            <span className="min-w-0 flex-1">
              <Link href={`/app/providers/${m.user_id}`} className="block truncate text-sm font-medium hover:underline">{m.display_name}{m.user_id === me.id ? ` (${t("You")})` : ""}</Link>
              <span className="text-xs text-ink-muted">{t(ROLE[m.role])}</span>
            </span>
            {isOwner && m.role !== "owner" && (
              <>
                <form action={setBusinessRole.bind(null, b.id, m.user_id, m.role === "manager" ? "member" : "manager")}>
                  <button type="submit" className="rounded-full border border-stone-300 px-2.5 py-1 text-xs font-medium hover:bg-brand-50">{m.role === "manager" ? t("Make member") : t("Make manager")}</button>
                </form>
                <form action={removeBusinessMember.bind(null, b.id, m.user_id)}>
                  <button type="submit" aria-label={t("Remove")} className="rounded-full p-1.5 text-ink-muted hover:bg-stone-100"><X className="size-4" /></button>
                </form>
              </>
            )}
          </li>
        ))}
      </ul>

      {manager && (
        <section className="card mt-3 p-4">
          <h3 className="font-semibold">{t("Invite people")}</h3>
          {candidates.length === 0 ? (
            <p className="mt-1 text-sm text-ink-muted">{t("You can invite people you already talk with. Nobody to invite yet.")}</p>
          ) : (
            <form action={inviteToBusiness.bind(null, b.id)} className="mt-2 space-y-2">
              <ul className="flex flex-wrap gap-2">
                {candidates.map((p) => (
                  <li key={p.id}>
                    <label className="cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-1 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-100">
                      <input type="checkbox" name="people" value={p.id} className="sr-only" />{p.display_name}
                    </label>
                  </li>
                ))}
              </ul>
              {isOwner ? (
                <select name="role" defaultValue="member" aria-label={t("Role")} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">
                  <option value="member">{t("Member")}</option>
                  <option value="manager">{t("Manager")}</option>
                </select>
              ) : (
                <input type="hidden" name="role" value="member" />
              )}
              <Button type="submit" className="px-4 py-2 text-sm">{t("Send invitations")}</Button>
            </form>
          )}
        </section>
      )}

      {!isOwner && (
        <form action={removeBusinessMember.bind(null, b.id, me.id)} className="mt-4">
          <button type="submit" className="inline-flex items-center gap-2 text-sm font-medium text-red-700"><LogOut className="size-4" />{t("Leave company")}</button>
        </form>
      )}
    </main>
  );
}
