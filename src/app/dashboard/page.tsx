import type { Metadata } from "next";
import Link from "next/link";
import { Button, PageTitle, Pill } from "@/components/ui";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDate, statusLabel, statusTone, type ProjectRequest, type ProviderApplication } from "@/lib/pilot";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "@/app/auth/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Your account") };
}

export default async function DashboardPage() {
  const [t, locale, supabase] = await Promise.all([getT(), getLocale(), createClient()]);
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims?.email as string | undefined) ?? "";
  const [{ data: admin }, { data: requests }, { data: applications }] = await Promise.all([
    supabase.from("admins").select("user_id").maybeSingle(),
    supabase.from("project_requests").select("id,details,status,created_at").order("created_at", { ascending: false }),
    supabase.from("provider_applications").select("id,skills,status,created_at").order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <PageTitle lead={t("Signed in as {email}", { email })}>{t("Your account")}</PageTitle>

      {admin && (
        <p className="mb-8">
          <Link href="/admin" className="font-semibold text-brand-800 underline">
            Admin
          </Link>
        </p>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-bold">{t("Your requests")}</h2>
        <List items={(requests ?? []) as Pick<ProjectRequest, "id" | "details" | "status" | "created_at">[]} text={(r) => r.details} t={t} locale={locale} />
        <Link href="/post-project" className="mt-3 inline-block text-sm font-medium underline">
          {t("Post a project")}
        </Link>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold">{t("Your provider application")}</h2>
        <List items={(applications ?? []) as Pick<ProviderApplication, "id" | "skills" | "status" | "created_at">[]} text={(a) => a.skills} t={t} locale={locale} />
        <Link href="/join" className="mt-3 inline-block text-sm font-medium underline">
          {t("Join as a provider")}
        </Link>
      </section>

      <form action={logOut}>
        <Button variant="secondary" type="submit">
          {t("Log out")}
        </Button>
      </form>
    </main>
  );
}

function List<Row extends { id: string; status: string; created_at: string }>({
  items,
  text,
  t,
  locale,
}: {
  items: Row[];
  text: (row: Row) => string;
  t: Awaited<ReturnType<typeof getT>>;
  locale: Awaited<ReturnType<typeof getLocale>>;
}) {
  if (items.length === 0) return <p className="mt-2 text-ink-muted">{t("Nothing yet.")}</p>;
  return (
    <ul className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200">
      {items.map((row) => (
        <li key={row.id} className="flex items-start justify-between gap-4 px-4 py-3">
          <div>
            <p className="line-clamp-2">{text(row)}</p>
            <p className="mt-1 text-sm text-ink-muted">{formatDate(row.created_at, locale)}</p>
          </div>
          <Pill tone={statusTone(row.status)}>{statusLabel(t, row.status)}</Pill>
        </li>
      ))}
    </ul>
  );
}
