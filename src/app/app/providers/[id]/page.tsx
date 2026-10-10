import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, inputClass, Notice, Pill } from "@/components/ui";
import { startConversation, toggleKeepProvider } from "@/lib/app/actions";
import { getMe, getProvider } from "@/lib/app/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../avatar";
import { Stars } from "@/app/demo/demo-ui";

/* eslint-disable @next/next/no-img-element */

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getProvider(id);
  return { title: data?.provider.display_name ?? "Piron Talent" };
}

export default async function ProviderPage({ params, searchParams }: Props) {
  const [{ id }, { error }, t, locale, me] = await Promise.all([params, searchParams, getT(), getLocale(), getMe()]);
  const data = await getProvider(id);
  if (!data) notFound();
  const { provider: p, portfolio, reviews } = data;
  const supabase = await createClient();
  const image = (path: string) => supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
  const path = `/app/providers/${p.id}`;
  const keep = toggleKeepProvider.bind(null, p.id, path);
  const connect = startConversation.bind(null, p.id);
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : null;

  return (
    <main className="px-4 py-4">
      <Link href="/app/services" className="text-sm font-medium underline">
        {t("Back")}
      </Link>
      <header className="mt-3 flex items-start gap-3">
        <AvatarImg name={p.display_name} url={p.avatar_url} size={14} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight">{p.display_name}</h1>
          <p className="text-ink-muted">
            {p.role_line ?? ""}
            {p.city ? ` · ${p.city}` : ""}
            {p.remote ? ` · ${t("Remote")}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            {rating !== null && <Stars rating={rating} />}
            <span className="text-ink-muted">{t("{n} completed jobs", { n: p.completed_jobs })}</span>
            {p.identity_checked && <Pill tone="green">{t("Identity checked")}</Pill>}
          </div>
        </div>
      </header>
      {error && <div className="mt-3"><Notice tone="error">{t("Something went wrong: {error}", { error })}</Notice></div>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {p.price_from && <span className="rounded-full bg-brand-100 px-3 py-1.5 text-sm font-semibold text-brand-900">{t("From {price}", { price: p.price_from })}</span>}
        <form action={keep}>
          <button type="submit" aria-pressed={p.saved} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${p.saved ? "border-brand-400 bg-brand-100" : "border-stone-300 bg-white hover:bg-stone-50"}`}>
            {p.saved ? t("Kept") : t("Keep")}
          </button>
        </form>
      </div>

      {p.bio && (
        <section className="mt-5">
          <h2 className="font-semibold">{t("About")}</h2>
          <p className="mt-1 whitespace-pre-wrap leading-relaxed">{p.bio}</p>
        </section>
      )}
      {p.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <li key={s} className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm">
              {s}
            </li>
          ))}
        </ul>
      )}

      {portfolio.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">{t("Portfolio")}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {portfolio.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <img src={image(item.image_path)} alt={item.caption ?? ""} className="aspect-[4/3] w-full object-cover" />
                {item.caption && <p className="px-2 py-1.5 text-xs">{item.caption}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {me && me.id !== p.id && (
        <section className="mt-6 rounded-2xl border border-brand-300 bg-brand-50 p-4">
          <h2 className="font-semibold">{t("Request a quote")}</h2>
          <form action={connect} className="mt-2 space-y-2">
            <input type="hidden" name="back" value={path} />
            <textarea name="body" rows={3} className={inputClass} placeholder={t("Your message")} required />
            <Button type="submit" className="px-4 py-2 text-sm">
              {t("Send message")}
            </Button>
          </form>
        </section>
      )}
      {!me && (
        <p className="mt-6 text-sm">
          <Link href={`/login?next=${encodeURIComponent(path)}`} className="font-medium underline">
            {t("Log in to continue")}
          </Link>
        </p>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">{t("Reviews")}</h2>
        {reviews.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">{t("Reviews are written only after a completed job.")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <Stars rating={r.stars} />
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                <p className="mt-1 text-xs text-ink-muted">
                  {r.author.display_name} · {formatDate(r.created_at, locale)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
