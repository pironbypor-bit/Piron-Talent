"use client";

import { Briefcase, ChevronRight, Plus, Users } from "lucide-react";
import { Button, Field, Pill, inputClass } from "@/components/ui";
import type { T } from "@/lib/i18n/core";
import { alerts, applications, companies, counts, openings, person, portfolio, requests, type Company } from "@/lib/demo/profile-hub-fixtures";

// Sub-pages of demo A. Each is one screen behind a card on the hub; the hub passes `back`.

export function Back({ t, onBack, title }: { t: T; onBack: () => void; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <button type="button" onClick={onBack} className="text-sm font-medium underline">{t("Back")}</button>
      <h1 className="text-lg font-bold">{title}</h1>
    </div>
  );
}

export function Row({ title, sub, right, onClick }: { title: string; sub?: string; right?: React.ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {sub && <span className="block truncate text-sm text-ink-muted">{sub}</span>}
      </span>
      {right}
      {onClick && <ChevronRight className="size-4 text-ink-muted" />}
    </>
  );
  return onClick ? <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-50">{inner}</button> : <div className="flex items-center gap-3 px-4 py-3">{inner}</div>;
}

/** My service: what customers see in Services and the switches that control it. */
export function ServiceScreen({ t, onBack }: { t: T; onBack: () => void }) {
  return (
    <div>
      <Back t={t} onBack={onBack} title={t("My service")} />
      <section className="card p-4">
        <p className="font-semibold">{person.roleLine}</p>
        <p className="text-sm text-ink-muted">{t("Visible in Services")} · {person.city}</p>
        <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
          {([[t("Rating"), `${person.rating} (${person.reviews})`], [t("Completed jobs"), String(person.completed)], [t("Reply time"), t("Within a day")]] as [string, string][]).map(([l, v]) => (
            <li key={l} className="rounded-xl bg-stone-50 p-2"><p className="font-bold">{v}</p><p className="text-[11px] text-ink-muted">{l}</p></li>
          ))}
        </ul>
      </section>
      <ul className="card mt-3 divide-y divide-stone-100">
        <Row title={t("Role line, skills, price from")} sub={`${person.roleLine} · Logo, Menu, Signage · $40`} onClick={() => {}} />
        <Row title={t("Portfolio")} sub={t("{n} items", { n: portfolio.length })} onClick={() => {}} />
        <Row title={t("Available this week")} right={<Pill tone="green">{t("On")}</Pill>} />
        <Row title={t("Visible in Services")} right={<Pill tone="green">{t("On")}</Pill>} />
      </ul>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {portfolio.map((p) => (
          <div key={p.caption} className={`aspect-square rounded-xl ${p.tone} p-2 text-xs font-medium`}>{p.caption}</div>
        ))}
      </div>
    </div>
  );
}

/** One company: openings, applicants, team, and the two post buttons. */
export function CompanyScreen({ t, company, onBack }: { t: T; company: Company; onBack: () => void }) {
  const c = counts(company.id);
  return (
    <div>
      <Back t={t} onBack={onBack} title={company.name} />
      <section className="card p-4">
        <p className="text-sm text-ink-muted">{company.kind} · {company.city} · {t("{n} in team", { n: company.team })}</p>
        <div className="mt-3 flex gap-2">
          <Button type="button" className="px-3 py-1.5 text-sm"><Briefcase className="mr-1 inline size-4" />{t("Post a job")}</Button>
          <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm">{t("Post a project")}</Button>
        </div>
      </section>
      <h2 className="mt-4 text-sm font-semibold text-ink-muted">{t("Openings")} · {c.jobs} {t("part-time")} · {c.projects} {t("projects")}</h2>
      <ul className="card mt-2 divide-y divide-stone-100">
        {(openings[company.id] ?? []).map((o) => (
          <Row key={o.title} title={o.title} sub={`${t(o.type)} · ${o.pay}`} right={<Pill tone="amber">{t("{n} applicants", { n: o.applicants })}</Pill>} onClick={() => {}} />
        ))}
      </ul>
      <ul className="card mt-3 divide-y divide-stone-100">
        <Row title={t("Applicants")} sub={t("{n} waiting for an answer", { n: c.applicants })} onClick={() => {}} />
        <Row title={t("Team")} sub={t("{n} in team", { n: company.team })} right={<Users className="size-4 text-ink-muted" />} onClick={() => {}} />
        <Row title={t("Company details")} sub={t("Name, kind, city, contact")} onClick={() => {}} />
      </ul>
    </div>
  );
}

/** Adding a company: three fields, nothing else. */
export function NewCompanyScreen({ t, onBack }: { t: T; onBack: () => void }) {
  return (
    <div>
      <Back t={t} onBack={onBack} title={t("Add company")} />
      <div className="card space-y-3 p-4">
        <Field label={t("Company name")}><input className={inputClass} placeholder="Sophea Café" /></Field>
        <Field label={t("Kind of business")}><input className={inputClass} placeholder={t("Café, shop, studio…")} /></Field>
        <Field label={t("City")}><input className={inputClass} defaultValue="Phnom Penh" /></Field>
        <Button type="button" onClick={onBack}><Plus className="mr-1 inline size-4" />{t("Create company")}</Button>
        <p className="text-xs text-ink-muted">{t("You can add more companies later. Each one has its own jobs, projects and team.")}</p>
      </div>
    </div>
  );
}

/** Customer side: things I asked for. */
export function RequestsScreen({ t, onBack }: { t: T; onBack: () => void }) {
  return (
    <div>
      <Back t={t} onBack={onBack} title={t("My requests")} />
      <ul className="card divide-y divide-stone-100">
        {requests.map((r) => (
          <Row key={r.title} title={r.title} sub={t("{n} days ago", { n: r.days })} right={<Pill tone={r.status === "In progress" ? "green" : "amber"}>{t(r.status)}</Pill>} onClick={() => {}} />
        ))}
      </ul>
      <Button type="button" className="mt-3 w-full">{t("Post a project")}</Button>
    </div>
  );
}

/** Worker side: applications and alerts. */
export function WorkScreen({ t, onBack }: { t: T; onBack: () => void }) {
  return (
    <div>
      <Back t={t} onBack={onBack} title={t("Looking for work")} />
      <h2 className="text-sm font-semibold text-ink-muted">{t("My applications")}</h2>
      <ul className="card mt-2 divide-y divide-stone-100">
        {applications.map((a) => (
          <Row key={a.title} title={a.title} sub={a.company} right={<Pill tone={a.status === "Shortlisted" ? "green" : "neutral"}>{t(a.status)}</Pill>} onClick={() => {}} />
        ))}
      </ul>
      <h2 className="mt-4 text-sm font-semibold text-ink-muted">{t("Job alerts")}</h2>
      <div className="card mt-2 flex flex-wrap items-center gap-2 p-3">
        {alerts.map((a) => <Pill key={a} tone="amber">{t(a)}</Pill>)}
        <button type="button" className="text-xs underline">{t("Change")}</button>
      </div>
      <p className="mt-2 text-xs text-ink-muted">{t("New part-time and freelance openings that match arrive as notifications.")}</p>
    </div>
  );
}

export { companies };
