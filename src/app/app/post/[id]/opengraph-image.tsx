import { getPost } from "@/lib/app/queries";
import { getT } from "@/lib/i18n/server";
import { OG_SIZE, shareCard } from "@/lib/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Piron Work";

/** Share picture for a project or post: the title and where it is. Row security decides what a visitor can read. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, t] = await Promise.all([params, getT()]);
  const data = await getPost(id);
  if (!data) return shareCard({ kicker: "Piron Work", title: "Piron Work" });
  const post = data.post;
  return shareCard({ kicker: post.kind === "need_help" ? t("Project") : t("Post"), title: post.title, subtitle: [post.place, post.remote ? t("Remote") : null].filter(Boolean).join(" · ") });
}
