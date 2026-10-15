import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { getMe, getPost, getProvider } from "@/lib/app/queries";
import type { Author, PostRow } from "@/lib/app/types";
import { getCategories } from "@/lib/categories";
import { getT } from "@/lib/i18n/server";
import { NewPostForm } from "./new-post-form";
import { StartChooser } from "./start-chooser";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Write a post@@title") };
}

const uuid = /^[0-9a-f-]{36}$/i;
type Params = { kind?: string; rehire?: string; to?: string; template?: string; business?: string };

/** New post, or a rehire: ?rehire=<my old post>&to=<provider> opens the form filled with the old scope, invited to that provider. */
export default async function NewPostPage({ searchParams }: { searchParams: Promise<Params> }) {
  const [t, categories, { kind, rehire, to, template, business }] = await Promise.all([getT(), getCategories(), searchParams]);
  let seed: { post: PostRow; provider: Author } | undefined;
  if (rehire && to && uuid.test(rehire) && uuid.test(to)) {
    const [me, old, prov] = await Promise.all([getMe(), getPost(rehire), getProvider(to)]);
    if (me && old && prov && old.post.author.id === me.id && prov.provider.id !== me.id) {
      seed = { post: old.post, provider: { id: prov.provider.id, display_name: prov.provider.display_name, avatar_url: prov.provider.avatar_url, role_line: prov.provider.role_line, identity_checked: prov.provider.identity_checked } };
    }
  }
  // No kind chosen yet: show the front page with the four tiles first.
  if (!kind && !rehire && !to && !template && !business) {
    const me = await getMe();
    return (
      <main className="px-4 py-4">
        <PageTitle>{t("Write a post@@title")}</PageTitle>
        <StartChooser t={t} name={me?.display_name ?? null} />
      </main>
    );
  }
  const initialKind = seed || template ? "need_help" : ["need_help", "offer_skill", "share_knowledge"].includes(kind ?? "") ? (kind as "need_help" | "offer_skill" | "share_knowledge") : "need_help";
  return (
    <main className="px-4 py-4">
      <PageTitle lead={seed ? t("Same scope as last time. Change anything, then send.") : undefined}>{seed ? t("Hire again") : t("Write a post@@title")}</PageTitle>
      <NewPostForm categories={categories} initialKind={initialKind} rehire={seed} initialTemplate={template} businessId={business && uuid.test(business) ? business : undefined} />
    </main>
  );
}
