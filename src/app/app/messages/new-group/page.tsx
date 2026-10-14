import type { Metadata } from "next";
import Link from "next/link";
import { Button, EmptyState, Field, Notice, PageTitle, inputClass } from "@/components/ui";
import { createGroup } from "@/lib/app/actions";
import { getMe, getPost, groupCandidates } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";
import { AvatarImg } from "../../avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("New group") };
}

const uuid = /^[0-9a-f-]{36}$/i;

/** Start a group: a name and people I already talk with. With ?post=<my project> the providers who quoted come first. */
export default async function NewGroupPage({ searchParams }: { searchParams: Promise<{ post?: string; error?: string }> }) {
  const [t, me, { post, error }] = await Promise.all([getT(), getMe(), searchParams]);
  if (!me) return null;
  const postId = post && uuid.test(post) ? post : null;
  const project = postId ? await getPost(postId) : null;
  const mine = !!project && project.post.author.id === me.id;
  const people = await groupCandidates(mine ? postId : null);

  return (
    <main className="px-4 pb-24 pt-4">
      <Link href="/app/messages" className="text-sm font-medium underline">{t("Back")}</Link>
      <div className="mt-3">
        <PageTitle lead={t("You can add people you already talk with, or providers who sent you a quote.")}>{t("New group")}</PageTitle>
      </div>
      {error && <div className="mb-4"><Notice tone="error">{t("Give the group a name and pick at least one person.")}</Notice></div>}
      {people.length === 0 ? (
        <EmptyState>{t("No one to add yet. Start a conversation with someone first.")}</EmptyState>
      ) : (
        <form action={createGroup} className="card space-y-4 p-4">
          {mine && postId && <input type="hidden" name="post" value={postId} />}
          <Field label={t("Group name")}>
            <input name="title" required minLength={2} maxLength={80} defaultValue={mine ? project?.post.title.slice(0, 80) : ""} className={inputClass} />
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">{t("People")}</legend>
            <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
              {people.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-brand-50">
                    <input type="checkbox" name="members" value={p.id} defaultChecked={mine} className="size-4 accent-brand-500" />
                    <AvatarImg name={p.display_name} url={p.avatar_url} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.display_name}</span>
                      {p.role_line && <span className="block truncate text-xs text-ink-muted">{p.role_line}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <Button type="submit">{t("Create group")}</Button>
        </form>
      )}
    </main>
  );
}
