import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Field, Notice, inputClass } from "@/components/ui";
import { requestBooking } from "@/lib/app/actions";
import { requireFeature } from "@/lib/app/features";
import { getMe, getProvider } from "@/lib/app/queries";
import { resolveCard } from "@/lib/app/cards";
import { getT } from "@/lib/i18n/server";
import { ProCard } from "../../professionals/pro-card";
import { addDays, todayPP } from "@/lib/datetime";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Book") };
}

const uuid = /^[0-9a-f-]{36}$/i;

/** The Book page: a short request form for one person. The provider accepts, suggests another price or time, or declines. */
export default async function BookPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireFeature("home_pages");
  const [{ id }, { error }, t, me] = await Promise.all([params, searchParams, getT(), getMe()]);
  if (!uuid.test(id)) notFound();
  const data = await getProvider(id);
  if (!data) notFound();
  const p = data.provider;
  const card = resolveCard({ ...p, skills: p.skills, card: null });
  const self = me?.id === id;
  const msg: Record<string, string> = {
    fields: t("Please say what you need (at least a few words) and check the budget."),
    limit: t("You sent several requests today. Try again tomorrow."),
    open: t("You already have an open request with this person. Wait for their answer or cancel it first."),
    unavailable: t("This person is not taking bookings right now."),
    self: t("You cannot book yourself."),
    failed: t("Something went wrong. Please try again."),
  };
  const action = requestBooking.bind(null, id);
  const tomorrow = addDays(todayPP(), 1);

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/professionals" className="text-sm font-medium underline">{t("Back")}</Link>
      <h1 className="mt-3 text-xl font-bold">{t("Book {name}", { name: p.display_name })}</h1>
      <div className="mt-3 max-w-[260px]">
        <ProCard id={p.id} card={card} avatarUrl={p.avatar_url} checked={p.identity_checked} availableUntil={p.available_until} rating={null} reviews={0} t={t} preview />
      </div>
      {error && <div className="mt-3"><Notice tone="error">{msg[error] ?? msg.failed}</Notice></div>}
      {self ? (
        <div className="mt-3"><Notice tone="info">{t("This is your own card. People book you from here.")}</Notice></div>
      ) : (
        <form action={action} className="card mt-3 space-y-4 p-4">
          <p className="text-sm text-ink-muted">{t("The price shown is a starting price. The provider can accept, suggest another price or time, or decline. Nothing is final until you both agree.")}</p>
          <Field label={t("What do you need?")}>
            <textarea name="details" required minLength={3} maxLength={1000} rows={4} placeholder={t("For example: fix two ceiling fans in my shop")} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Date")} optional={t("optional")}>
              <input type="date" name="date" min={todayPP()} defaultValue={tomorrow} className={inputClass} />
            </Field>
            <Field label={t("Time")} optional={t("optional")}>
              <input type="time" name="time" defaultValue="09:00" className={inputClass} />
            </Field>
          </div>
          <Field label={t("Place")} optional={t("optional")}>
            <input name="place" maxLength={120} className={inputClass} />
          </Field>
          <Field label={t("Your budget (USD)")} optional={t("optional")}>
            <input name="budget" inputMode="decimal" placeholder="0.00" className={inputClass} />
          </Field>
          <p className="text-xs text-ink-muted">{t("You pay the provider directly, as agreed. Piron Work does not take or hold money.")}</p>
          <Button type="submit">{t("Send booking request")}</Button>
        </form>
      )}
    </main>
  );
}
