import { cache } from "react";
import { isCity } from "@/lib/cities";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { BusinessDetail, BusinessRow, Author, CommentRow, ConversationRow, JobRow, MeRow, MessageRow, NotificationRow, PostRow, ProjectJobRow, ProjectScope, ProviderRow, QuoteRow, DisputeRow } from "./types";

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
    .select(`${AUTHOR},bio,city,district,is_available,available_until,price_from,remote,primary_category_id,completed_jobs,profile_skills(skills(name))`)
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
    .select(`id,kind,title,body,place,price_text,category_id,created_at,deadline,budget_min,budget_max,remote,deliverables,invited_provider_id,opens_at,invited:profiles!posts_invited_provider_id_fkey(${AUTHOR}),author:profiles!posts_author_id_fkey(${AUTHOR}),post_reactions(count),post_comments(count)`)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as unknown as (Omit<PostRow, "cheers" | "comments" | "cheered" | "kept" | "author" | "invited"> & { author: Author | Author[]; invited: Author | Author[] | null; post_reactions: unknown; post_comments: unknown })[];
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
    invited: one(r.invited),
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
    .select(`id,kind,title,body,place,price_text,category_id,created_at,deadline,budget_min,budget_max,remote,deliverables,invited_provider_id,opens_at,invited:profiles!posts_invited_provider_id_fkey(${AUTHOR}),author:profiles!posts_author_id_fkey(${AUTHOR}),post_reactions(count),post_comments(count)`)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const r = data as unknown as Omit<PostRow, "cheers" | "comments" | "cheered" | "kept" | "author" | "invited"> & { author: Author | Author[]; invited: Author | Author[] | null; post_reactions: unknown; post_comments: unknown };
  const [{ data: comments }, mine, kept] = await Promise.all([
    supabase.from("post_comments").select(`id,body,created_at,author:profiles!post_comments_author_id_fkey(${AUTHOR})`).eq("post_id", id).order("created_at"),
    uid ? supabase.from("post_reactions").select("post_id").eq("user_id", uid).eq("post_id", id).maybeSingle() : Promise.resolve({ data: null }),
    uid ? supabase.from("saved_posts").select("post_id").eq("user_id", uid).eq("post_id", id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    post: { ...r, author: one(r.author) as Author, invited: one(r.invited), cheers: count(r.post_reactions), comments: count(r.post_comments), cheered: !!mine.data, kept: !!kept.data },
    comments: ((comments ?? []) as unknown as (Omit<CommentRow, "author"> & { author: Author | Author[] })[]).map((c) => ({ ...c, author: one(c.author) as Author })),
  };
}

/** Measured reply time per provider from the database; empty when nobody has replied yet. */
async function replySignals(supabase: Awaited<ReturnType<typeof createClient>>, ids: string[]) {
  const map = new Map<string, { reply_minutes: number | null; replies: number }>();
  if (!ids.length) return map;
  const { data } = await supabase.rpc("provider_signals", { p_ids: ids });
  for (const r of (data ?? []) as { provider_id: string; reply_minutes: number | null; replies: number }[]) map.set(r.provider_id, { reply_minutes: r.reply_minutes, replies: r.replies });
  return map;
}

const withSkills = <T extends SkillJoin>(row: T) => ({ ...row, skills: row.profile_skills.map((s) => s.skills?.name).filter(Boolean) as string[] });

export type ProviderSort = "rated" | "completed" | "newest";

export async function listProviders(opts: { categoryId?: number; q?: string; remote?: boolean; city?: string; sort?: ProviderSort } = {}): Promise<(ProviderRow & { rating: number | null; reviews: number })[]> {
  const supabase = await createClient();
  const uid = await getUserId();
  const term = (opts.q ?? "").trim().slice(0, 60);
  let ids: string[] | null = null;
  if (term) {
    // Skills live in their own table: find matching skill names first, then the profiles that have them.
    const { data: skillRows } = await supabase.from("profile_skills").select("profile_id,skills!inner(name)").ilike("skills.name", `%${term}%`).limit(200);
    ids = ((skillRows ?? []) as unknown as { profile_id: string }[]).map((r) => r.profile_id);
  }
  let query = supabase
    .from("profiles")
    .select(`${AUTHOR},city,district,available_until,bio,price_from,remote,completed_jobs,primary_category_id,created_at,profile_skills(skills(name)),reviews!reviews_subject_id_fkey(stars)`)
    .eq("is_available", true)
    .limit(60);
  if (opts.categoryId) query = query.eq("primary_category_id", opts.categoryId);
  if (opts.remote) query = query.eq("remote", true);
  if (opts.city && isCity(opts.city)) query = query.or(`city.eq.${opts.city},remote.eq.true`);
  if (term) {
    const safe = term.replace(/[%,()]/g, " ");
    const parts = [`display_name.ilike.%${safe}%`, `role_line.ilike.%${safe}%`, `bio.ilike.%${safe}%`];
    if (ids && ids.length) parts.push(`id.in.(${ids.join(",")})`);
    query = query.or(parts.join(","));
  }
  const { data } = await query;
  type Row = Omit<ProviderRow, "skills" | "saved" | "reply_minutes" | "replies"> & SkillJoin & { created_at: string; reviews: { stars: number }[] };
  const rows = (data ?? []) as unknown as Row[];
  let saved = new Set<string>();
  if (uid && rows.length) {
    const { data: s } = await supabase.from("saved_providers").select("provider_id").eq("user_id", uid);
    saved = new Set((s ?? []).map((x) => x.provider_id));
  }
  const signals = await replySignals(supabase, rows.map((r) => r.id));
  const out = rows.map((r) => {
    const n = r.reviews?.length ?? 0;
    const rating = n ? r.reviews.reduce((a, x) => a + x.stars, 0) / n : null;
    const sig = signals.get(r.id) ?? { reply_minutes: null, replies: 0 };
    return { ...withSkills(r), ...sig, saved: saved.has(r.id), rating, reviews: n };
  });
  const sort = opts.sort ?? "rated";
  out.sort((a, b) =>
    sort === "newest" ? b.created_at.localeCompare(a.created_at)
    : sort === "completed" ? b.completed_jobs - a.completed_jobs || Number(b.identity_checked) - Number(a.identity_checked)
    : (b.rating ?? 0) - (a.rating ?? 0) || b.reviews - a.reviews || Number(b.identity_checked) - Number(a.identity_checked) || b.completed_jobs - a.completed_jobs,
  );
  return out;
}

export async function myPortfolio() {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("portfolio_items").select("id,image_path,caption,sort_order").eq("provider_id", uid).order("sort_order").order("created_at");
  return (data ?? []) as { id: string; image_path: string; caption: string | null; sort_order: number }[];
}

export async function getProvider(id: string) {
  const supabase = await createClient();
  const uid = await getUserId();
  const [{ data }, { data: portfolio }, { data: reviews }, saved] = await Promise.all([
    supabase.from("profiles").select(`${AUTHOR},city,district,available_until,bio,price_from,remote,completed_jobs,primary_category_id,profile_skills(skills(name))`).eq("id", id).maybeSingle(),
    supabase.from("portfolio_items").select("id,image_path,caption,sort_order").eq("provider_id", id).order("sort_order"),
    supabase.from("reviews").select(`id,stars,comment,created_at,author:profiles!reviews_author_id_fkey(${AUTHOR})`).eq("subject_id", id).order("created_at", { ascending: false }).limit(10),
    uid ? supabase.from("saved_providers").select("provider_id").eq("user_id", uid).eq("provider_id", id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!data) return null;
  const sig = (await replySignals(supabase, [id])).get(id) ?? { reply_minutes: null, replies: 0 };
  const provider: ProviderRow = { ...withSkills(data as unknown as Omit<ProviderRow, "skills" | "saved" | "reply_minutes" | "replies"> & SkillJoin), ...sig, saved: !!saved.data };
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
  const { data, error } = await supabase
    .from("conversations")
    .select(`id,created_at,conversation_members(user_id,last_read_at,profiles(${AUTHOR})),messages(body,created_at,sender_id)`)
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(1, { referencedTable: "messages" })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("listConversations:", error.message);
  type Row = { id: string; conversation_members: { user_id: string; last_read_at: string | null; profiles: Author | Author[] | null }[]; messages: { body: string; created_at: string; sender_id: string }[] };
  const rows = ((data ?? []) as unknown as Row[]).map((c) => {
    const otherMember = c.conversation_members.find((m) => m.user_id !== uid);
    const me = c.conversation_members.find((m) => m.user_id === uid);
    const last = c.messages[0] ?? null;
    const unread = !!last && last.sender_id !== uid && new Date(last.created_at) > new Date(me?.last_read_at ?? 0);
    return { id: c.id, other: otherMember ? one(otherMember.profiles) : null, last, unread };
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
    supabase.rpc("mark_conversation_read", { p_conv: id }), // opening the conversation clears its unread mark
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

/** Conversations with a message from the other person since I last opened them. */
export async function countUnreadConversations(): Promise<number> {
  const uid = await getUserId();
  if (!uid) return 0;
  const supabase = await createClient();
  const { data } = await supabase.rpc("unread_conversations");
  return (data as number | null) ?? 0;
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

/** Email switch from Settings. No private row yet means on. */
export async function myEmailNotifications(): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return true;
  const supabase = await createClient();
  const { data } = await supabase.from("profile_private").select("email_notifications").eq("user_id", uid).maybeSingle();
  return data?.email_notifications ?? true;
}

export async function isAdmin(): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", uid).maybeSingle();
  return !!data;
}

// Phase 2 core loop ------------------------------------------------------------------------------------------

/** Everything the project panel on a Job offer post needs. Quotes come back under RLS: the author sees all, a provider sees only their own. */
export async function getProjectPanel(postId: string) {
  const supabase = await createClient();
  const uid = await getUserId();
  const [{ data: scope }, { data: quotes }, { data: job }, { data: countData }] = await Promise.all([
    supabase.from("posts").select("deliverables,deadline,remote,budget_min,budget_max").eq("id", postId).maybeSingle(),
    uid ? supabase.from("quotes").select(`id,post_id,provider_id,price,days,note,status,created_at,provider:profiles!quotes_provider_id_fkey(${AUTHOR},completed_jobs,reviews!reviews_subject_id_fkey(stars))`).eq("post_id", postId).order("created_at") : Promise.resolve({ data: [] }),
    uid ? supabase.from("project_jobs").select("id,post_id,quote_id,customer_id,provider_id,agreed_price,status,delivered_at,confirmed_at,note,created_at").eq("post_id", postId).in("status", ["accepted", "delivered", "confirmed"]).maybeSingle() : Promise.resolve({ data: null }),
    supabase.rpc("quote_count", { p_post: postId }),
  ]);
  let reviewed = false;
  let dispute: DisputeRow | null = null;
  if (job && uid) {
    const j = job as { id: string; quote_id: string };
    const [{ data: r }, { data: d }] = await Promise.all([
      supabase.from("reviews").select("id").eq("project_job_id", j.id).eq("author_id", uid).maybeSingle(),
      supabase.from("disputes").select("id,opened_by,status,reason,resolution,created_at").eq("quote_id", j.quote_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    reviewed = !!r;
    dispute = (d ?? null) as DisputeRow | null;
  }
  return {
    scope: (scope ?? { deliverables: [], deadline: null, remote: false, budget_min: null, budget_max: null }) as ProjectScope,
    quotes: ((quotes ?? []) as unknown as (Omit<QuoteRow, "provider" | "stats"> & { provider: (Author & { completed_jobs: number; reviews: { stars: number }[] }) | (Author & { completed_jobs: number; reviews: { stars: number }[] })[] })[]).map((q) => {
      const p = one(q.provider)!;
      const { completed_jobs, reviews, ...author } = p;
      const n = reviews?.length ?? 0;
      const quoteStats = { rating: n ? reviews.reduce((a, x) => a + x.stars, 0) / n : null, reviews: n, completed_jobs };
      return { ...q, provider: author as Author, stats: quoteStats };
    }),
    job: (job ?? null) as ProjectJobRow | null,
    count: typeof countData === "number" ? countData : 0,
    reviewed,
    dispute,
  };
}

/** The post of my latest confirmed job with this provider, as customer; the seed for "Hire again". */
export async function lastConfirmedJobWith(providerId: string): Promise<string | null> {
  const uid = await getUserId();
  if (!uid || uid === providerId) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("project_jobs").select("post_id").eq("customer_id", uid).eq("provider_id", providerId).eq("status", "confirmed").order("confirmed_at", { ascending: false }).limit(1).maybeSingle();
  return data?.post_id ?? null;
}

/** Jobs I am part of, either side, newest first. */
export async function myJobs() {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_jobs")
    .select(`id,post_id,customer_id,provider_id,agreed_price,status,created_at,post:posts!project_jobs_post_id_fkey(title),customer:profiles!project_jobs_customer_id_fkey(${AUTHOR}),provider:profiles!project_jobs_provider_id_fkey(${AUTHOR})`)
    .or(`customer_id.eq.${uid},provider_id.eq.${uid}`)
    .order("created_at", { ascending: false })
    .limit(50);
  type Row = { id: string; post_id: string; customer_id: string; provider_id: string; agreed_price: number; status: string; created_at: string; post: { title: string } | { title: string }[] | null; customer: Author | Author[]; provider: Author | Author[] };
  return ((data ?? []) as unknown as Row[]).map((r) => ({ ...r, title: one(r.post)?.title ?? "", customer: one(r.customer) as Author, provider: one(r.provider) as Author, mine: r.customer_id === uid ? "customer" : "provider" }));
}

// Companies (migration 0020) ----------------------------------------------------------------------------------

/** The companies I own, with how many published jobs and projects each has. */
export async function myBusinesses(): Promise<BusinessRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("businesses").select("id,name,description,city,created_at").eq("owner_id", uid).order("created_at");
  const rows = (data ?? []) as Omit<BusinessRow, "jobs" | "projects">[];
  if (rows.length === 0) return [];
  const ids = rows.map((b) => b.id);
  const [{ data: jobs }, { data: posts }] = await Promise.all([
    supabase.from("jobs").select("business_id").in("business_id", ids).eq("status", "published"),
    supabase.from("posts").select("business_id").in("business_id", ids).eq("status", "published"),
  ]);
  const count = (list: { business_id: string }[] | null, id: string) => (list ?? []).filter((x) => x.business_id === id).length;
  return rows.map((b) => ({ ...b, jobs: count(jobs as { business_id: string }[] | null, b.id), projects: count(posts as { business_id: string }[] | null, b.id) }));
}

/** One of my companies with its openings; null when it is not mine. */
export async function getBusiness(id: string): Promise<BusinessDetail | null> {
  const uid = await getUserId();
  if (!uid || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: b } = await supabase.from("businesses").select("id,name,description,city,created_at").eq("id", id).eq("owner_id", uid).maybeSingle();
  if (!b) return null;
  const [{ data: jobs }, { data: posts }] = await Promise.all([
    supabase.from("jobs").select("id,title,job_type,status,created_at").eq("business_id", id).neq("status", "closed").order("created_at", { ascending: false }),
    supabase.from("posts").select("id,title,status,created_at").eq("business_id", id).eq("status", "published").order("created_at", { ascending: false }),
  ]);
  const jobRows = (jobs ?? []) as { id: string; title: string; job_type: string; status: string; created_at: string }[];
  const { data: apps } = jobRows.length ? await supabase.from("job_applications").select("job_id").in("job_id", jobRows.map((j) => j.id)) : { data: [] };
  const applicants = (apps ?? []) as { job_id: string }[];
  return { ...(b as Omit<BusinessRow, "jobs" | "projects">), jobs: jobRows.map((j) => ({ ...j, applicants: applicants.filter((a) => a.job_id === j.id).length })), posts: (posts ?? []) as BusinessDetail["posts"] };
}
