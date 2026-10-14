"use client";

import { useState } from "react";
import { Briefcase, Building2, ChevronRight, Plus, Search, Store } from "lucide-react";
import { CheckedPill, Pill } from "@/components/ui";
import { useT } from "@/lib/i18n/client";
import { applications, companies, counts, person, requests, type Company } from "@/lib/demo/profile-hub-fixtures";
import { DemoCompare } from "../demo-compare";
import { CompanyScreen, NewCompanyScreen, RequestsScreen, ServiceScreen, WorkScreen } from "./screens";

// Demo A, "cards": the profile front page is a hub. One card per hat (need work done, offer a service, my
// companies, looking for work). Each card opens its own page. Notifications and Settings live in the top-bar menu.

type Screen = { kind: "hub" } | { kind: "service" } | { kind: "requests" } | { kind: "work" } | { kind: "company"; company: Company } | { kind: "new-company" };

export function ProfileHubA() {
  const t = useT();
  const [screen, setScreen] = useState<Screen>({ kind: "hub" });
  const back = () => setScreen({ kind: "hub" });

  if (screen.kind === "service") return <><DemoCompare /><ServiceScreen t={t} onBack={back} /></>;
  if (screen.kind === "requests") return <><DemoCompare /><RequestsScreen t={t} onBack={back} /></>;
  if (screen.kind === "work") return <><DemoCompare /><WorkScreen t={t} onBack={back} /></>;
  if (screen.kind === "company") return <><DemoCompare /><CompanyScreen t={t} company={screen.company} onBack={back} /></>;
  if (screen.kind === "new-company") return <><DemoCompare /><NewCompanyScreen t={t} onBack={back} /></>;

  const card = "card mt-3 overflow-hidden";
  const head = "flex items-center gap-3 px-4 pt-3";
  const icon = "flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800";
  const open = (s: Screen, label: string) => (
    <button type="button" onClick={() => setScreen(s)} className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold hover:bg-brand-50">
      {label} <ChevronRight className="size-4 text-ink-muted" />
    </button>
  );

  return (
    <div>
      <DemoCompare />
      <div className="hero-amber flex items-start justify-between gap-3 rounded-3xl p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-ink">S</span>
          <div>
            <h1 className="text-xl font-bold">{person.name}</h1>
            <p className="text-sm text-brand-900">{person.roleLine} · {t(person.city)}</p>
            {person.identity && <span className="mt-1 inline-block"><CheckedPill>{t("Identity checked")}</CheckedPill></span>}
          </div>
        </div>
      </div>

      {/* 1. Customer */}
      <section className={card}>
        <div className={head}>
          <span className={icon}><Search className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("I need work done")}</p>
            <p className="text-sm text-ink-muted">{t("{n} open requests", { n: requests.length })} · {t("Fix the kitchen tap")}: {t("3 quotes")}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-2 px-4">
          <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-ink">{t("Find a service")}</span>
          <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold">{t("Post a project")}</span>
        </div>
        {open({ kind: "requests" }, t("My requests"))}
      </section>

      {/* 2. Provider */}
      <section className={card}>
        <div className={head}>
          <span className={icon}><Store className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("I offer a service")}</p>
            <p className="text-sm text-ink-muted">{person.roleLine} · ★ {person.rating} ({person.reviews}) · {t("{n} completed jobs", { n: person.completed })}</p>
          </div>
          <Pill tone="green">{t("Visible")}</Pill>
        </div>
        {open({ kind: "service" }, t("My service"))}
      </section>

      {/* 3. Companies */}
      <section className={card}>
        <div className={head}>
          <span className={icon}><Building2 className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("My companies")}</p>
            <p className="text-sm text-ink-muted">{t("Hire part-time staff or freelancers under a company name.")}</p>
          </div>
        </div>
        <ul className="mt-2 divide-y divide-stone-100 border-t border-stone-100">
          {companies.map((c) => {
            const n = counts(c.id);
            return (
              <li key={c.id}>
                <button type="button" onClick={() => setScreen({ kind: "company", company: c })} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{c.name}</span>
                    <span className="block text-xs text-ink-muted">{n.jobs} {t("part-time")} · {n.projects} {t("projects")} · {t("{n} applicants", { n: n.applicants })}</span>
                  </span>
                  <ChevronRight className="size-4 text-ink-muted" />
                </button>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setScreen({ kind: "new-company" })} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">
              <Plus className="size-4" /> {t("Add company")}
            </button>
          </li>
        </ul>
      </section>

      {/* 4. Worker */}
      <section className={card}>
        <div className={head}>
          <span className={icon}><Briefcase className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t("Looking for work")}</p>
            <p className="text-sm text-ink-muted">{t("{n} applications", { n: applications.length })} · {t("Job alerts")}: {t("Creative")}, {t("Phnom Penh")}</p>
          </div>
        </div>
        {open({ kind: "work" }, t("My applications"))}
      </section>

    </div>
  );
}
