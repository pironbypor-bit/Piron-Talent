import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChooseScreen } from "@/components/choose-screen";
import { getMe, isOwner } from "@/lib/app/queries";

export const metadata: Metadata = { title: "Choose where to go" };
export const dynamic = "force-dynamic";

/** After login the owner picks the app or the Space. Everyone else goes straight to the app. */
export default async function ChoosePage() {
  const [me, owner] = await Promise.all([getMe(), isOwner()]);
  if (!me) redirect("/login?next=/choose");
  if (!owner) redirect("/app");
  return <ChooseScreen name={me.display_name} appHref="/app" spaceHref="/admin/space" />;
}
