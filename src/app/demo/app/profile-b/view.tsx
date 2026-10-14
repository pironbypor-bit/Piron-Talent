"use client";

import { useState } from "react";
import { Bell, Briefcase, Plus, Settings, Store, Users } from "lucide-react";
import { Button, CheckedPill, Field, Pill, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { alerts, applications, companies, counts, openings, person, portfolio, requests } from "@/lib/demo/profile-hub-fixtures";
import { DemoCompare } from "../demo-compare";
import { Row } from "../profile-a/screens";

// Demo B, "switcher": one profile page; a row of chips at the top picks the hat (me, my service, each company).
// The content below is that hat's dashboard. Fewer pages, one place to add a company, and settings behind the gear.

type Hat = "me" | "service" | "new" | "settings" | string;

export function ProfileSwitcherB() {
  const t = useT();
  const [hat, setHat] = useState<Hat>("me");
  const chip = (key: Hat, label: string, Icon?: typeof Store) => (
    <button key={key} type="button" onClick={() => setHat(key)} aria-pressed={hat === key} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${hat === key ? "border-ink bg-ink text-white" : "border-stone-300 bg-white"}`}>
      {Icon && <Icon className="size-3.5" />}{label}
    </button>
  );
  const company = companies.find((c) => c.id === hat);

  return (
    <div>
      <DemoCompare />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-ink">S</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">{person.name}</h1>
            {person.identity && <CheckedPill>{t("Identity checked")}</CheckedPill>}
          </div>
        </div>
        <button type="button" aria-label={t("Settings")} onClick={() => setHat("settings")} className="rounded-full bg-stone-100 p-2 text-ink-muted"><Settings className="size-4" /></button>
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {chip("me", t("Me"))}
        {chip("service", t("My service"), Store)}
        {companies.map((c) => chip(c.id, c.name, Briefcase))}
        {chip("new", t("Add company"), Plus)}
      </div>

      {hat === "me" && (
        <>
          <ul className="mt-4 grid grid-cols-4 gap-2 text-center">
            {([[t("Requests"), requests.length], [t("Applications"), applications.length], [t("Saved"), 12], [t("Kept providers"), 4]] as [string, number][]).map(([l, n]) => (
              <li key={l} className="card p-2"><p className="text-xl font-bold">{n}</p><p className="text-[11px] leading-tight text-ink-muted">{l}</p></li>
            ))}
          </ul>
          <h2 className="mt-4 text-sm font-semibold text-ink-muted">{t("I need work done")}</h2>
          <ul className="card mt-2 divide-y divide-stone-100">
            {requests.map((r) => <Row key={r.title} title={r.title} sub={t("{n} days ago", { n: r.days })} right={<Pill tone={r.status === "In progress" ? "green" : "amber"}>{t(r.status)}</Pill>} onClick={() => {}} />)}
          </ul>
          <div className="mt-2 flex gap-2">
            <Button type="button" className="px-3 py-1.5 text-sm">{t("Find a service")}</Button>
            <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm">{t("Post a project")}</Button>
          </div>
          <h2 className="mt-4 text-sm font-semibold text-ink-muted">{t("Looking for work")}</h2>
          <ul className="card mt-2 divide-y divide-stone-100">
            {applications.map((a) => <Row key={a.title} title={a.title} sub={a.company} right={<Pill tone={a.status === "Shortlisted" ? "green" : "neutral"}>{t(a.status)}</Pill>} onClick={() => {}} />)}
            <Row title={t("Job alerts")} sub={alerts.map((a) => t(a)).join(", ")} onClick={() => {}} />
          </ul>
          <ul className="card mt-3 divide-y divide-stone-100">
            <li className="flex items-center gap-3 px-4 py-3"><Bell className="size-4 text-ink-muted" /><span className="flex-1 font-medium">{t("Notifications")}</span><Pill tone="amber">3</Pill></li>
          </ul>
        </>
      )}

      {hat === "service" && (
        <>
          <section className="card mt-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <div><p className="font-semibold">{person.roleLine}</p><p className="text-sm text-ink-muted">★ {person.rating} ({person.reviews}) · {t("{n} completed jobs", { n: person.completed })}</p></div>
              <Pill tone="green">{t("Visible")}</Pill>
            </div>
          </section>
          <ul className="card mt-3 divide-y divide-stone-100">
            <Row title={t("Visible in Services")} right={<Pill tone="green">{t("On")}</Pill>} />
            <Row title={t("Available this week")} right={<Pill tone="green">{t("On")}</Pill>} />
            <Row title={t("Role line, skills, price from")} sub={`${person.roleLine} · $40`} onClick={() => {}} />
            <Row title={t("Portfolio")} sub={t("{n} items", { n: portfolio.length })} onClick={() => {}} />
            <Row title={t("Reviews")} sub={`${person.reviews}`} onClick={() => {}} />
          </ul>
        </>
      )}

      {company && (() => {
        const n = counts(company.id);
        return (
          <>
            <section className="card mt-4 p-4">
              <p className="font-semibold">{company.name}</p>
              <p className="text-sm text-ink-muted">{company.kind} · {company.city} · {t("{n} in team", { n: company.team })}</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" className="px-3 py-1.5 text-sm">{t("Post a job")}</Button>
                <Button type="button" variant="secondary" className="px-3 py-1.5 text-sm">{t("Post a project")}</Button>
              </div>
            </section>
            <h2 className="mt-4 text-sm font-semibold text-ink-muted">{t("Openings")} · {n.jobs} {t("part-time")} · {n.projects} {t("projects")}</h2>
            <ul className="card mt-2 divide-y divide-stone-100">
              {(openings[company.id] ?? []).map((o) => <Row key={o.title} title={o.title} sub={`${t(o.type)} · ${o.pay}`} right={<Pill tone="amber">{t("{n} applicants", { n: o.applicants })}</Pill>} onClick={() => {}} />)}
            </ul>
            <ul className="card mt-3 divide-y divide-stone-100">
              <Row title={t("Applicants")} sub={t("{n} waiting for an answer", { n: n.applicants })} onClick={() => {}} />
              <Row title={t("Team")} sub={t("{n} in team", { n: company.team })} right={<Users className="size-4 text-ink-muted" />} onClick={() => {}} />
              <Row title={t("Company details")} sub={t("Name, kind, city, contact")} onClick={() => {}} />
            </ul>
          </>
        );
      })()}

      {hat === "new" && (
        <div className="card mt-4 space-y-3 p-4">
          <Field label={t("Company name")}><input className={inputClass} placeholder="Sophea Café" /></Field>
          <Field label={t("Kind of business")}><input className={inputClass} placeholder={t("Café, shop, studio…")} /></Field>
          <Field label={t("City")}><input className={inputClass} defaultValue="Phnom Penh" /></Field>
          <Button type="button" onClick={() => setHat("cafe")}>{t("Create company")}</Button>
        </div>
      )}

      {hat === "settings" && (
        <ul className="card mt-4 divide-y divide-stone-100">
          <Row title={t("What I use Piron Work for")} sub={`${t("Find help")} · ${t("Offer a service")} · ${t("Hire for my companies")}`} onClick={() => {}} />
          <Row title={t("Language")} sub="ខ្មែរ / EN" onClick={() => {}} />
          <Row title={t("Notifications")} sub={t("Phone, email")} onClick={() => {}} />
          <Row title={t("Identity check")} right={<Pill tone="green">{t("Checked")}</Pill>} />
          <Row title={t("Log out")} onClick={() => {}} />
        </ul>
      )}
    </div>
  );
}
