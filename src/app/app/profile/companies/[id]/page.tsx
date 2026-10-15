import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, CalendarClock, CalendarDays, ListChecks, ChevronRight, FileText, FolderOpen, Globe, LogOut, MessageCircle, X } from "lucide-react";
import { Button, EmptyState, Pill, inputClass } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import { inviteToBusiness, openBusinessChat, removeBusinessMember, setBusinessRole, setCompanyPage, setShowOnProfile } from "@/lib/app/actions";
import { businessPendingInvites, getBusiness, getMe, groupCandidates } from "@/lib/app/queries";
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
  const waiting = manager ? await businessPendingInvites(b.id) : [];
  const waitingIds = new Set(waiting.map((w) => w.id));
  const candidates = manager && b.team.length < 20 ? (await groupCandidates()).filter((p) => !inTeam.has(p.id) && !waitingIds.has(p.id)) : [];
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

      <section className="card mt-3 p-4">
        <h2 className="font-semibold">{t("Team work")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/app/profile/companies/${b.id}/schedule`} className={`${btn} bg-brand-500 text-ink hover:bg-brand-400`}><CalendarDays className="size-4" />{t("Schedule")}</Link>
          <Link href={`/app/profile/companies/${b.id}/tasks`} className={`${btn} border border-stone-300 bg-white hover:bg-brand-50`}><ListChecks className="size-4" />{t("Tasks")}</Link>
        </div>
      </section>

      <section className="card mt-3 p-4">
        <h2 className="font-semibold">{t("Documents and public page")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/app/profile/companies/${b.id}/documents`} className={`${btn} bg-brand-500 text-ink hover:bg-brand-400`}><FolderOpen className="size-4" />{t("Documents")}</Link>
          {b.page_public && <Link href={`/companies/${b.id}`} className={`${btn} border border-stone-300 bg-white hover:bg-brand-50`}><Globe className="size-4" />{t("Open public page")}</Link>}
          {manager && <Link href={`/app/activities/new?business=${b.id}`} className={`${btn} border border-stone-300 bg-white hover:bg-brand-50`}><CalendarClock className="size-4" />{t("Organise an activity")}</Link>}
          {b.page_public && <ShareButton path={`/companies/${b.id}`} title={b.name} />}
        </div>
        {isOwner ? (
          <form action={setCompanyPage.bind(null, b.id)} className="mt-4 space-y-3">
            <label className="block text-sm font-medium">
              {t("About the company")}
              <textarea name="about" defaultValue={b.about ?? ""} maxLength={500} rows={3} placeholder={t("A few lines for visitors: what you do and where.")} className={`${inputClass} mt-1`} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="public" value="1" defaultChecked={b.page_public} className="size-4" />
              {t("Show the company page to everyone")}
            </label>
            <Button type="submit" className="px-4 py-2 text-sm">{t("Save page")}</Button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">{b.page_public ? t("The company page is public.") : t("The company page is not public. Only the owner can turn it on.")}</p>
        )}
      </section>

      <form action={setShowOnProfile.bind(null, b.id)} className="card mt-3 flex items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("Show this company on my profile")}</p>
          <p className="text-sm text-ink-muted">{t("Your profile says Works at, with your job title. It appears only while the company page is public.")}</p>
        </div>
        <input type="hidden" name="show" value={b.show_on_profile ? "0" : "1"} />
        <button type="submit" role="switch" aria-checked={b.show_on_profile} aria-label={t("Show this company on my profile")} className={`relative h-6 w-11 shrink-0 rounded-full transition ${b.show_on_profile ? "bg-emerald-500" : "bg-stone-300"}`}>
          <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${b.show_on_profile ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </form>

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

      <h2 className="mt-5 text-sm font-semibold text-ink-muted">{t("Organisation chart")}</h2>
      <section className="card mt-2 space-y-3 p-4">
        {(["owner", "manager", "member"] as const).map((tier) => {
          const row = b.team.filter((m) => m.role === tier);
          if (row.length === 0) return null;
          return (
            <div key={tier} className="flex flex-wrap justify-center gap-2">
              {row.map((m) => (
                <div key={m.user_id} className={`min-w-28 rounded-xl border px-3 py-2 text-center ${tier === "owner" ? "border-brand-400 bg-brand-50" : "border-stone-200 bg-white"}`}>
                  <p className="text-sm font-semibold">{m.display_name}</p>
                  <p className="text-xs text-ink-muted">{m.job_title ?? t(ROLE[m.role])}</p>
                </div>
              ))}
            </div>
          );
        })}
      </section>

      <Link href={`/app/profile/companies/${b.id}/terms`} className="card mt-3 flex items-center justify-between px-4 py-3 font-semibold hover:bg-brand-50">
        {t("Terms and pay")}
        <span className="text-xs font-normal text-ink-muted">{isOwner ? t("Private: you and each person") : t("Private: you and the owner")}</span>
      </Link>

      <h2 className="mt-5 text-sm font-semibold text-ink-muted">{t("Team")} · {b.team.length}</h2>
      <ul className="card mt-2 divide-y divide-stone-100">
        {b.team.map((m) => (
          <li key={m.user_id} className="flex items-center gap-3 px-4 py-2.5">
            <AvatarImg name={m.display_name} url={m.avatar_url} />
            <span className="min-w-0 flex-1">
              <Link href={`/app/providers/${m.user_id}`} className="block truncate text-sm font-medium hover:underline">{m.display_name}{m.user_id === me.id ? ` (${t("You")})` : ""}</Link>
              <span className="text-xs text-ink-muted">{m.job_title ? `${m.job_title} · ` : ""}{t(ROLE[m.role])}</span>
            </span>
            {isOwner && m.role !== "owner" && (
              <>
                {(m.role === "manager" || b.team.length >= 3) && (
                  <form action={setBusinessRole.bind(null, b.id, m.user_id, m.role === "manager" ? "member" : "manager")}>
                    <button type="submit" className="rounded-full border border-stone-300 px-2.5 py-1 text-xs font-medium hover:bg-brand-50">{m.role === "manager" ? t("Make member") : t("Make manager")}</button>
                  </form>
                )}
                <form action={removeBusinessMember.bind(null, b.id, m.user_id)}>
                  <button type="submit" aria-label={t("Remove")} className="rounded-full p-1.5 text-ink-muted hover:bg-stone-100"><X className="size-4" /></button>
                </form>
              </>
            )}
          </li>
        ))}
      </ul>

      {waiting.length > 0 && (
        <p className="mt-2 text-sm text-ink-muted">{t("Waiting for an answer")}: {waiting.map((w) => w.name).join(", ")}</p>
      )}

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
              <input type="hidden" name="role" value="member" />
              <p className="text-xs font-medium text-ink-muted">{t("Terms of work (optional, private to you and them)")}</p>
              <input name="job_title" maxLength={80} placeholder={t("Job title")} className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm" />
              <textarea name="duties" maxLength={1000} rows={2} placeholder={t("Duties: one line each")} className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <input name="rate" type="number" step="0.01" min="0" placeholder={t("Rate")} className="w-24 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm" />
                <select name="rate_unit" defaultValue="hour" className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm">
                  <option value="hour">{t("per hour")}</option>
                  <option value="day">{t("per day")}</option>
                  <option value="month">{t("per month")}</option>
                </select>
              </div>
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
