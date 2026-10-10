import { cache } from "react";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { Author, CommentRow, ConversationRow, JobRow, MeRow, MessageRow, NotificationRow, PostRow, ProviderRow } from "./types";

// Read helpers for the app. Every query runs as the visitor (RLS applies); anonymous visitors can browse.

const AUTHOR = "id,display_name,avatar_url,role_line,identity_checked";
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
type SkillJoin = { profile_skills: { skills: { name: string } | null }[] };
const count = (v: unknown) => (Array.isArray(v) && v[0] && typeof v[0] === "object" && "count" in v[0] ? Number((v[0] as { count: number }).count) : 0);

export const getMe = cache(async (): Promise<MeRow | null> => {
  const uid = await getUserId();
  if (!uid) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(`${AUTHOR},bio,city,is_available,price_from,remote,primary_category_id,completed_jobs,profile_skills(skills(name))`)
    .eq("id", uid)
    .maybeSingle();
  if (!data) return null;
  const { profile_skills, ...rest } = data as unknown as Omit<MeRow, "skills"> & SkillJoin;
  return { ...rest, skills: profile_skills.map((s) => s.skills?.name).filter(Boolean) as string[] };
});

export async function listPosts(limit = 40): Promise<PostRow[]> {
  const supabase = await createClient();
  const uid = await getUserId();
  const { data } = await supabase
    .from("posts")
    .select(`id,kind,title,body,place,price_text,category_id,created_at,author:profiles!posts_author_id_fkey(${AUTHOR}),post_reactions(count),post_comments(count)`)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as unknown as (Omit<PostRow, "cheers" | "comments" | "cheered" | "kept" | "author"> & { author: Author | Author[]; post_reactions: unknown; post_comments: unknown })[];
  let mine = new Set<string>();
  let kept = new Set<string>();
  if (uid && rows.length) {
    const ids = rows.map((r) => r.id);
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from("post_reactions").select("post_id").eq("user_id", uid).in("post_id", ids),
      supabase.from("saved_posts").select("post_id").eq("user_id", uid).in("post_id", ids),
    ]);
    mine = new Set((r ?? []).map((x) => x.post_id));
    kept = new Set((s ?? []).map((x) => x.post_id));
  }
  return rows.map((r) => ({
    ...r,
    author: one(r.author) as Author,
    cheers: count(r.post_reactions),
    comments: count(r.post_comments),
    cheered: mine.has(r.id),
    kept: kept.has(r.id),
  }));
}

export async function getPost(id: string): Promise<{ post: PostRow; comments: CommentRow[] } | null> {
  const supabase = await createClient();
  const uid = await getUserId();
  const { data } = await supabase
    .from("posts")
    .select(`id,kind,title,body,place,price_text,category_id,created_at,author:profiles!posts_author_id_fkey(${AUTHOR}),post_reactions(count),post_comments(count)`)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const r = data as unknown as Omit<PostRow, "cheers" | "comments" | "cheered" | "kept" | "author"> & { author: Author | Author[]; post_reactions: unknown; post_comments: unknown };
  const [{ data: comments }, mine, kept] = await Promise.all([
    supabase.from("post_comments").select(`id,body,created_at,author:profiles!post_comments_author_id_fkey(${AUTHOR})`).eq("post_id", id).order("created_at"),
    uid ? supabase.from("post_reactions").select("post_id").eq("user_id", uid).eq("post_id", id).maybeSingle() : Promise.resolve({ data: null }),
    uid ? supabase.from("saved_posts").select("post_id").eq("user_id", uid).eq("post_id", id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    post: { ...r, author: one(r.author) as Author, cheers: count(r.post_reactions), comments: count(r.post_comments), cheered: !!mine.data, kept: !!kept.data },
    comments: ((comments ?? []) as unknown as (Omit<CommentRow, "author"> & { author: Author | Author[] })[]).map((c) => ({ ...c, author: one(c.author) as Author })),
  };
}

const withSkills = <T extends SkillJoin>(row: T) => ({ ...row, skills: row.profile_skills.map((s) => s.skills?.name).filter(Boolean) as string[] });

export async function listProviders(categoryId?: number): Promise<ProviderRow[]> {
  const supabase = await createClient();
  const uid = await getUserId();
  let q = supabase
    .from("profiles")
    .select(`${AUTHOR},city,bio,price_from,remote,completed_jobs,primary_category_id,profile_skills(skills(name))`)
    .eq("is_available", true)
    .order("identity_checked", { ascending: false })
    .order("completed_jobs", { ascending: false })
    .limit(60);
  if (categoryId) q = q.eq("primary_category_id", categoryId);
  const { data } = await q;
  const rows = (data ?? []) as unknown as (Omit<ProviderRow, "skills" | "saved"> & SkillJoin)[];
  let saved = new Set<string>();
  if (uid && rows.length) {
    const { data: s } = await supabase.from("saved_providers").select("provider_id").eq("user_id", uid);
    saved = new Set((s ?? []).map((x) => x.provider_id));
  }
  return rows.map((r) => ({ ...withSkills(r), saved: saved.has(r.id) }));
}

export async function getProvider(id: string) {
  const supabase = await createClient();
  const uid = await getUserId();
  const [{ data }, { data: portfolio }, { data: reviews }, saved] = await Promise.all([
    supabase.from("profiles").select(`${AUTHOR},city,bio,price_from,remote,completed_jobs,primary_category_id,profile_skills(skills(name))`).eq("id", id).maybeSingle(),
    supabase.from("portfolio_items").select("id,image_path,caption,sort_order").eq("provider_id", id).order("sort_order"),
    supabase.from("reviews").select(`id,stars,comment,created_at,author:profiles!reviews_author_id_fkey(${AUTHOR})`).eq("subject_id", id).order("created_at", { ascending: false }).limit(10),
    uid ? supabase.from("saved_providers").select("provider_id").eq("user_id", uid).eq("provider_id", id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!data) return null;
  const provider: ProviderRow = { ...withSkills(data as unknown as Omit<ProviderRow, "skills" | "saved"> & SkillJoin), saved: !!saved.data };
  return {
    provider,
    portfolio: (portfolio ?? []) as { id: string; image_path: string; caption: string | null; sort_order: number }[],
    reviews: ((reviews ?? []) as unknown as { id: string; stars: number; comment: string | null; created_at: string; author: Author | Author[] }[]).map((r) => ({ ...r, author: one(r.author) as Author })),
  };
}

export async function listJobs(): Promise<JobRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select(`id,title,description,city,remote_available,job_type,pay_amount,pay_unit,starts_at,ends_at,created_at,poster:profiles!jobs_poster_id_fkey(${AUTHOR})`)
    .eq("status", "published")
    .in("job_type", ["freelance", "project"])
    .order("created_at", { ascending: false })
    .limit(60);
  return ((data ?? []) as unknown as (Omit<JobRow, "poster"> & { poster: Author | Author[] })[]).map((j) => ({ ...j, poster: one(j.poster) as Author }));
}

export async function getJob(id: string) {
  const supabase = await createClient();
  const uid = await getUserId();
  const { data } = await supabase
    .from("jobs")
    .select(`id,title,description,city,remote_available,job_type,pay_amount,pay_unit,starts_at,ends_at,created_at,status,worker_count,poster:profiles!jobs_poster_id_fkey(${AUTHOR})`)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const job = { ...(data as unknown as Omit<JobRow, "poster"> & { status: string; worker_count: number; poster: Author | Author[] }), poster: one((data as { poster: Author | Author[] }).poster) as Author };
  const mine = job.poster.id === uid;
  const [{ data: application }, { data: applicants }] = await Promise.all([
    uid && !mine ? supabase.from("job_applications").select("id,status,created_at").eq("job_id", id).eq("applicant_id", uid).maybeSingle() : Promise.resolve({ data: null }),
    mine ? supabase.from("job_applications").select(`id,cover_note,status,created_at,applicant:profiles!job_applications_applicant_id_fkey(${AUTHOR})`).eq("job_id", id).order("created_at") : Promise.resolve({ data: [] }),
  ]);
  return {
    job,
    mine,
    application: application as { id: string; status: string; created_at: string } | null,
    applicants: ((applicants ?? []) as unknown as { id: string; cover_note: string | null; status: string; created_at: string; applicant: Author | Author[] }[]).map((a) => ({ ...a, applicant: one(a.applicant) as Author })),
  };
}

export async function listConversations(): Promise<ConversationRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(`id,created_at,conversation_members(user_id,profiles(${AUTHOR})),messages(body,created_at,sender_id)`)
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(1, { referencedTable: "messages" })
    .order("created_at", { ascending: false })
    .limit(50);
  type Row = { id: string; conversation_members: { user_id: string; profiles: Author | Author[] | null }[]; messages: { body: string; created_at: string; sender_id: string }[] };
  const rows = ((data ?? []) as unknown as Row[]).map((c) => {
    const otherMember = c.conversation_members.find((m) => m.user_id !== uid);
    return { id: c.id, other: otherMember ? one(otherMember.profiles) : null, last: c.messages[0] ?? null };
  });
  return rows.sort((a, b) => (b.last?.created_at ?? "").localeCompare(a.last?.created_at ?? ""));
}

export async function getConversation(id: string): Promise<{ other: Author | null; messages: MessageRow[] } | null> {
  const uid = await getUserId();
  if (!uid) return null;
  const supabase = await createClient();
  const [{ data: members }, { data: messages }] = await Promise.all([
    supabase.from("conversation_members").select(`user_id,profiles(${AUTHOR})`).eq("conversation_id", id),
    supabase.from("messages").select("id,body,created_at,sender_id").eq("conversation_id", id).order("created_at").limit(200),
  ]);
  if (!members || members.length === 0) return null;
  const otherMember = (members as unknown as { user_id: string; profiles: Author | Author[] | null }[]).find((m) => m.user_id !== uid);
  return { other: otherMember ? one(otherMember.profiles) : null, messages: (messages ?? []) as MessageRow[] };
}

export async function listNotifications(limit = 30): Promise<NotificationRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id,title,body,link_path,read_at,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as NotificationRow[];
}

export async function countUnread(): Promise<number> {
  const uid = await getUserId();
  if (!uid) return 0;
  const supabase = await createClient();
  const { count: n } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).is("read_at", null);
  return n ?? 0;
}

/** Counters for the profile tab. */
export async function myCounters() {
  const uid = await getUserId();
  if (!uid) return { savedPosts: 0, savedProviders: 0, applications: 0, posts: 0 };
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [a, b, c, d] = await Promise.all([
    supabase.from("saved_posts").select("post_id", head).eq("user_id", uid),
    supabase.from("saved_providers").select("provider_id", head).eq("user_id", uid),
    supabase.from("job_applications").select("id", head).eq("applicant_id", uid),
    supabase.from("posts").select("id", head).eq("author_id", uid),
  ]);
  return { savedPosts: a.count ?? 0, savedProviders: b.count ?? 0, applications: c.count ?? 0, posts: d.count ?? 0 };
}

export async function myIdentityStatus(): Promise<"none" | "pending" | "checked" | "rejected"> {
  const uid = await getUserId();
  if (!uid) return "none";
  const supabase = await createClient();
  const { data } = await supabase.from("identity_checks").select("status").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data?.status as "pending" | "checked" | "rejected" | undefined) ?? "none";
}
