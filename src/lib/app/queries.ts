import { cache } from "react";
import { isCity } from "@/lib/cities";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { PayoutAccount, InvoiceRow, ShiftRow, TaskRow, WorksAt, CompanyDoc, CompanyPublic, MemberTerms, PayRecordRow, BusinessInvitationRow, BusinessRole, TeamMember, JobAlertRow, BlockedPerson, ActivityMine, ActivityRow, ActivityVolunteer, InvitationRow, InviteCandidate, InviteState, ConversationDetail, ContactState, MessageRequestRow, WorkRecordRow, BusinessDetail, BusinessRow, Author, CommentRow, ConversationRow, JobRow, MeRow, MessageRow, NotificationRow, PostRow, ProjectJobRow, ProjectScope, ProviderRow, QuoteRow, DisputeRow } from "./types";

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
    .select(`${AUTHOR},bio,city,district,is_available,available_until,record_public,price_from,remote,primary_category_id,completed_jobs,profile_skills(skills(name))`)
    .eq("id", uid)
    .maybeSingle();
  if (!data) return null;
  const { profile_skills, ...rest } = data as unknown as Omit<MeRow, "skills"> & SkillJoin;
  return { ...rest, skills: profile_skills.map((s) => s.skills?.name).filter(Boolean) as string[] };
});

export async function listPosts(limit = 40, search?: string): Promise<PostRow[]> {
  const supabase = await createClient();
  const uid = await getUserId();
  // Words typed in the Home search bar: match title or body. Characters that mean something to the filter are removed.
  const word = (search ?? "").replace(/[^\p{L}\p{N}\p{M} ]+/gu, " ").replace(/ +/g, " ").trim().slice(0, 60);
  let query = supabase
    .from("posts")
    .select(`id,kind,title,body,place,price_text,category_id,created_at,deadline,budget_min,budget_max,remote,deliverables,invited_provider_id,opens_at,invited:profiles!posts_invited_provider_id_fkey(${AUTHOR}),author:profiles!posts_author_id_fkey(${AUTHOR}),post_reactions(count),post_comments(count)`)
    .eq("status", "published");
  if (word) query = query.or(`title.ilike.%${word}%,body.ilike.%${word}%`);
  const { data } = await query.order("created_at", { ascending: false }).limit(limit);
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
  const [{ data }, { data: portfolio }, { data: reviews }, saved, { data: record }, { data: endorsed }, { data: works }] = await Promise.all([
    supabase.from("profiles").select(`${AUTHOR},city,district,available_until,bio,price_from,remote,completed_jobs,primary_category_id,profile_skills(skills(name))`).eq("id", id).maybeSingle(),
    supabase.from("portfolio_items").select("id,image_path,caption,sort_order").eq("provider_id", id).order("sort_order"),
    supabase.from("reviews").select(`id,stars,comment,created_at,author:profiles!reviews_author_id_fkey(${AUTHOR})`).eq("subject_id", id).order("created_at", { ascending: false }).limit(10),
    uid ? supabase.from("saved_providers").select("provider_id").eq("user_id", uid).eq("provider_id", id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.rpc("work_record", { p_user: id }),
    supabase.from("endorsements").select("skill").eq("to_user", id),
    supabase.rpc("profile_works_at", { p_user: id }),
  ]);
  if (!data) return null;
  const counts = new Map<string, number>();
  for (const e of (endorsed ?? []) as { skill: string }[]) counts.set(e.skill, (counts.get(e.skill) ?? 0) + 1);
  const endorsements = [...counts.entries()].map(([skill, n]) => ({ skill, n })).sort((a, b) => b.n - a.n);
  const sig = (await replySignals(supabase, [id])).get(id) ?? { reply_minutes: null, replies: 0 };
  const provider: ProviderRow = { ...withSkills(data as unknown as Omit<ProviderRow, "skills" | "saved" | "reply_minutes" | "replies"> & SkillJoin), ...sig, saved: !!saved.data };
  return {
    provider,
    portfolio: (portfolio ?? []) as { id: string; image_path: string; caption: string | null; sort_order: number }[],
    reviews: ((reviews ?? []) as unknown as { id: string; stars: number; comment: string | null; created_at: string; author: Author | Author[] }[]).map((r) => ({ ...r, author: one(r.author) as Author })),
    record: (record ?? []) as WorkRecordRow[],
    endorsements,
    worksAt: ((works ?? []) as WorksAt[]),
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
    .select(`id,kind,title,created_at,conversation_members(user_id,last_read_at,profiles(${AUTHOR})),messages(body,created_at,sender_id)`)
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(1, { referencedTable: "messages" })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("listConversations:", error.message);
  type Row = { id: string; kind: "direct" | "group"; title: string | null; conversation_members: { user_id: string; last_read_at: string | null; profiles: Author | Author[] | null }[]; messages: { body: string; created_at: string; sender_id: string }[] };
  const rows = ((data ?? []) as unknown as Row[]).map((c) => {
    const otherMember = c.conversation_members.find((m) => m.user_id !== uid);
    const me = c.conversation_members.find((m) => m.user_id === uid);
    const last = c.messages[0] ?? null;
    const unread = !!last && last.sender_id !== uid && new Date(last.created_at) > new Date(me?.last_read_at ?? 0);
    const sender = last ? c.conversation_members.find((m) => m.user_id === last.sender_id) : undefined;
    return {
      id: c.id,
      kind: c.kind,
      title: c.title,
      memberCount: c.conversation_members.length,
      other: c.kind === "direct" && otherMember ? one(otherMember.profiles) : null,
      last,
      lastSenderName: sender ? one(sender.profiles)?.display_name ?? null : null,
      unread,
    };
  });
  return rows.sort((a, b) => (b.last?.created_at ?? "").localeCompare(a.last?.created_at ?? ""));
}

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  const uid = await getUserId();
  if (!uid) return null;
  const supabase = await createClient();
  const [{ data: conv }, { data: members }, { data: messages }] = await Promise.all([
    supabase.from("conversations").select("kind,title,post_id").eq("id", id).maybeSingle(),
    supabase.from("conversation_members").select(`user_id,role,profiles(${AUTHOR})`).eq("conversation_id", id).order("joined_at"),
    supabase.from("messages").select("id,body,created_at,sender_id,attachment_path,attachment_type").eq("conversation_id", id).order("created_at").limit(200),
    supabase.rpc("mark_conversation_read", { p_conv: id }), // opening the conversation clears its unread mark
  ]);
  if (!conv || !members || members.length === 0) return null;
  const list = (members as unknown as { user_id: string; role: "owner" | "member"; profiles: Author | Author[] | null }[])
    .map((m) => ({ ...(one(m.profiles) as Author), role: m.role }))
    .filter((m) => m.id);
  const c = conv as { kind: "direct" | "group"; title: string | null; post_id: string | null };
  const { data: blocked } = c.kind === "direct" ? await supabase.rpc("chat_blocked", { p_conv: id }) : { data: false };
  return {
    kind: c.kind,
    title: c.title,
    postId: c.post_id,
    other: c.kind === "direct" ? list.find((m) => m.id !== uid) ?? null : null,
    members: list,
    iAmOwner: list.some((m) => m.id === uid && m.role === "owner"),
    blocked: blocked === true,
    messages: (messages ?? []) as MessageRow[],
  };
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

/** Notification groups I muted in Settings (migration 0030). Nothing muted when there is no private row yet. */
export async function myMutedGroups(): Promise<string[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("profile_private").select("muted_groups").eq("user_id", uid).maybeSingle();
  return (data?.muted_groups as string[] | null) ?? [];
}

/** Reminders switch from Settings (migration 0027). No private row yet means on. */
export async function myReminders(): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return true;
  const supabase = await createClient();
  const { data } = await supabase.from("profile_private").select("reminders_enabled").eq("user_id", uid).maybeSingle();
  return data?.reminders_enabled ?? true;
}

/** What is waiting for an admin (migration 0029). Zeros for everyone else. */
export type AdminCounts = { identity: number; reports: number; disputes: number; requests: number; applications: number; total: number };
export async function adminCounts(): Promise<AdminCounts> {
  const zero = { identity: 0, reports: 0, disputes: 0, requests: 0, applications: 0, total: 0 };
  const uid = await getUserId();
  if (!uid) return zero;
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_counts");
  const r = (Array.isArray(data) ? data[0] : data) as Omit<AdminCounts, "total"> | null;
  if (!r) return zero;
  return { ...r, total: r.identity + r.reports + r.disputes + r.requests + r.applications };
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
  let providerSkills: string[] = [];
  if (job && uid) {
    const j = job as { id: string; quote_id: string; provider_id: string };
    const [{ data: r }, { data: d }, { data: sk }] = await Promise.all([
      supabase.from("reviews").select("id").eq("project_job_id", j.id).eq("author_id", uid).maybeSingle(),
      supabase.from("disputes").select("id,opened_by,status,reason,resolution,created_at").eq("quote_id", j.quote_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("profile_skills").select("skills(name)").eq("profile_id", j.provider_id),
    ]);
    reviewed = !!r;
    dispute = (d ?? null) as DisputeRow | null;
    providerSkills = ((sk ?? []) as unknown as SkillJoin["profile_skills"]).map((s) => s.skills?.name).filter(Boolean) as string[];
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
    providerSkills,
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

/** The companies I belong to (owner, manager or member), with how many published jobs and projects each has. */
export async function myBusinesses(): Promise<BusinessRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_members")
    .select("role,business:businesses(id,name,description,city,created_at,conversation_id)")
    .eq("user_id", uid);
  type Base = Omit<BusinessRow, "jobs" | "projects" | "role">;
  type Row = { role: BusinessRole; business: Base | Base[] | null };
  const rows = ((data ?? []) as unknown as Row[])
    .map((r) => ({ ...(one(r.business) as Base), role: r.role }))
    .filter((r) => r.id)
    .sort((x, y) => x.created_at.localeCompare(y.created_at));
  if (rows.length === 0) return [];
  const ids = rows.map((b) => b.id);
  const [{ data: jobs }, { data: posts }] = await Promise.all([
    supabase.from("jobs").select("business_id").in("business_id", ids).eq("status", "published"),
    supabase.from("posts").select("business_id").in("business_id", ids).eq("status", "published"),
  ]);
  const count = (list: { business_id: string }[] | null, id: string) => (list ?? []).filter((x) => x.business_id === id).length;
  return rows.map((b) => ({ ...b, jobs: count(jobs as { business_id: string }[] | null, b.id), projects: count(posts as { business_id: string }[] | null, b.id) }));
}

/** One of my companies with its openings and team; null when I do not belong to it. */
export async function getBusiness(id: string): Promise<BusinessDetail | null> {
  const uid = await getUserId();
  if (!uid || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: mine } = await supabase.from("business_members").select("role,show_on_profile").eq("business_id", id).eq("user_id", uid).maybeSingle();
  if (!mine) return null;
  const role = (mine as { role: BusinessRole }).role;
  const showOnProfile = !!(mine as { show_on_profile: boolean }).show_on_profile;
  const { data: b } = await supabase.from("businesses").select("id,name,description,city,created_at,conversation_id,page_public,about").eq("id", id).maybeSingle();
  if (!b) return null;
  const manager = role === "owner" || role === "manager";
  const [{ data: jobs }, { data: posts }, { data: team }] = await Promise.all([
    manager ? supabase.from("jobs").select("id,title,job_type,status,created_at").eq("business_id", id).neq("status", "closed").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    manager ? supabase.from("posts").select("id,title,status,created_at").eq("business_id", id).eq("status", "published").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.rpc("business_team", { p_business: id }),
  ]);
  const jobRows = (jobs ?? []) as { id: string; title: string; job_type: string; status: string; created_at: string }[];
  const { data: apps } = jobRows.length ? await supabase.from("job_applications").select("job_id").in("job_id", jobRows.map((j) => j.id)) : { data: [] };
  const applicants = (apps ?? []) as { job_id: string }[];
  return {
    ...(b as Omit<BusinessRow, "jobs" | "projects" | "role"> & { page_public: boolean; about: string | null }),
    role,
    show_on_profile: showOnProfile,
    team: (team ?? []) as TeamMember[],
    jobs: jobRows.map((j) => ({ ...j, applicants: applicants.filter((a) => a.job_id === j.id).length })),
    posts: (posts ?? []) as BusinessDetail["posts"],
  };
}

/** Terms of work: the owner gets everyone's, a member only their own (migration 0032). Private. */
export async function businessTerms(businessId: string): Promise<MemberTerms[]> {
  const uid = await getUserId();
  if (!uid || !/^[0-9a-f-]{36}$/i.test(businessId)) return [];
  const { data } = await (await createClient()).rpc("business_terms", { p_business: businessId });
  return ((data ?? []) as (Omit<MemberTerms, "rate"> & { rate: number | string | null })[]).map((r) => ({ ...r, rate: r.rate === null ? null : Number(r.rate) }));
}

/** Pay records: the owner sees all of the company's, a member only their own. */
export async function businessPay(businessId: string): Promise<PayRecordRow[]> {
  const uid = await getUserId();
  if (!uid || !/^[0-9a-f-]{36}$/i.test(businessId)) return [];
  const { data } = await (await createClient())
    .from("pay_records")
    .select("id,user_id,period_from,period_to,quantity,unit,rate,amount,status,paid_on,note")
    .eq("business_id", businessId)
    .order("period_from", { ascending: false })
    .limit(200);
  return ((data ?? []) as (Omit<PayRecordRow, "quantity" | "rate" | "amount"> & { quantity: number | string; rate: number | string; amount: number | string })[]).map((r) => ({ ...r, quantity: Number(r.quantity), rate: Number(r.rate), amount: Number(r.amount) }));
}

/** People this company invited who have not answered yet (visible to whoever invited them). */
export async function businessPendingInvites(businessId: string): Promise<{ id: string; name: string }[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_invitations")
    .select("user_id,user:profiles!business_invitations_user_id_fkey(display_name)")
    .eq("business_id", businessId)
    .eq("status", "pending");
  return ((data ?? []) as unknown as { user_id: string; user: { display_name: string } | { display_name: string }[] | null }[]).map((r) => ({ id: r.user_id, name: one(r.user)?.display_name ?? "" }));
}

/** Company invitations waiting for my answer. */
export async function myBusinessInvitations(): Promise<BusinessInvitationRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_invitations")
    .select(`id,business_id,role,created_at,business:businesses(name),inviter:profiles!business_invitations_invited_by_fkey(display_name)`)
    .eq("user_id", uid)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  type Row = { id: string; business_id: string; role: "manager" | "member"; created_at: string; business: { name: string } | { name: string }[] | null; inviter: { display_name: string } | { display_name: string }[] | null };
  return ((data ?? []) as unknown as Row[]).map((r) => ({ id: r.id, business_id: r.business_id, role: r.role, created_at: r.created_at, business_name: one(r.business)?.name ?? "", inviter: one(r.inviter)?.display_name ?? "" }));
}

// Message requests, "Say hello" (migration 0022) ----------------------------------------------------------------

/** What the profile page offers me for this person: open, already talking, can request, pending... */
export async function contactState(userId: string): Promise<{ state: ContactState; conversationId: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("contact_state", { p_user: userId });
  const row = (Array.isArray(data) ? data[0] : data) as { state: ContactState; conv_id: string | null } | null;
  return { state: row?.state ?? "anon", conversationId: row?.conv_id ?? null };
}

/** Requests waiting for my answer, and the ones I sent that nobody answered yet. */
export async function myMessageRequests(): Promise<{ incoming: MessageRequestRow[]; outgoing: MessageRequestRow[] }> {
  const uid = await getUserId();
  if (!uid) return { incoming: [], outgoing: [] };
  const supabase = await createClient();
  const { data } = await supabase
    .from("message_requests")
    .select(`id,body,created_at,from_user,to_user,from:profiles!message_requests_from_user_fkey(${AUTHOR}),to:profiles!message_requests_to_user_fkey(${AUTHOR})`)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(30);
  type Row = { id: string; body: string; created_at: string; from_user: string; to_user: string; from: Author | Author[]; to: Author | Author[] };
  const rows = (data ?? []) as unknown as Row[];
  const incoming = rows.filter((r) => r.to_user === uid).map((r) => ({ id: r.id, body: r.body, created_at: r.created_at, other: one(r.from) as Author }));
  const outgoing = rows.filter((r) => r.from_user === uid).map((r) => ({ id: r.id, body: r.body, created_at: r.created_at, other: one(r.to) as Author }));
  return { incoming, outgoing };
}

/** People I may add to a group: everyone I already talk with, plus providers who quoted on this project of mine. */
export async function groupCandidates(postId?: string | null): Promise<Author[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const pool = new Map<string, Author>();
  for (const c of await listConversations()) if (c.kind === "direct" && c.other) pool.set(c.other.id, c.other);
  if (postId && /^[0-9a-f-]{36}$/i.test(postId)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("quotes")
      .select(`provider_id,provider:profiles!quotes_provider_id_fkey(${AUTHOR})`)
      .eq("post_id", postId)
      .in("status", ["pending", "accepted"]);
    for (const r of (data ?? []) as unknown as { provider_id: string; provider: Author | Author[] }[]) {
      const p = one(r.provider);
      if (p) pool.set(p.id, p);
    }
  }
  pool.delete(uid);
  return [...pool.values()];
}

// Invitations to a project (migration 0024) --------------------------------------------------------------------

/** The author's invited list with who already quoted, and who they could invite next; for a provider, whether they were invited. */
export async function getInviteState(postId: string, categoryId: number | null, authorId: string): Promise<InviteState> {
  const uid = await getUserId();
  const empty: InviteState = { invited: [], candidates: [], invitedMe: false };
  if (!uid) return empty;
  const supabase = await createClient();
  if (uid !== authorId) {
    const { data } = await supabase.from("post_invitations").select("post_id").eq("post_id", postId).eq("provider_id", uid).maybeSingle();
    return { ...empty, invitedMe: !!data };
  }
  const [{ data: inv }, { data: quoted }, { data: kept }, { data: worked }] = await Promise.all([
    supabase.from("post_invitations").select(`provider_id,created_at,provider:profiles!post_invitations_provider_id_fkey(${AUTHOR})`).eq("post_id", postId).order("created_at"),
    supabase.from("quotes").select("provider_id").eq("post_id", postId),
    supabase.from("saved_providers").select("provider_id").eq("user_id", uid),
    supabase.from("project_jobs").select("provider_id").eq("customer_id", uid).eq("status", "confirmed"),
  ]);
  const quotedIds = new Set(((quoted ?? []) as { provider_id: string }[]).map((r) => r.provider_id));
  const invited: InvitationRow[] = ((inv ?? []) as unknown as { provider_id: string; created_at: string; provider: Author | Author[] }[]).map((r) => ({ provider: one(r.provider) as Author, quoted: quotedIds.has(r.provider_id), created_at: r.created_at }));
  const skip = new Set<string>([uid, ...invited.map((i) => i.provider.id), ...quotedIds]);
  const source = new Map<string, InviteCandidate["source"]>();
  for (const r of (kept ?? []) as { provider_id: string }[]) source.set(r.provider_id, "kept");
  for (const r of (worked ?? []) as { provider_id: string }[]) source.set(r.provider_id, "worked");
  const ids = [...source.keys()].filter((id) => !skip.has(id));
  const select = `${AUTHOR},is_available`;
  const [{ data: known }, { data: sameCategory }] = await Promise.all([
    ids.length ? supabase.from("profiles").select(select).in("id", ids) : Promise.resolve({ data: [] }),
    categoryId ? supabase.from("profiles").select(select).eq("primary_category_id", categoryId).eq("is_available", true).limit(12) : Promise.resolve({ data: [] }),
  ]);
  // Same rule as the database: invite providers who are open to work, or people I already talk with.
  const talking = new Set((await listConversations()).filter((c) => c.kind === "direct" && c.other).map((c) => c.other!.id));
  const out = new Map<string, InviteCandidate>();
  for (const p of (known ?? []) as unknown as (Author & { is_available: boolean })[]) {
    if (p.is_available || talking.has(p.id)) out.set(p.id, { ...p, source: source.get(p.id) ?? "kept" });
  }
  for (const p of (sameCategory ?? []) as unknown as (Author & { is_available: boolean })[]) {
    if (!skip.has(p.id) && !out.has(p.id)) out.set(p.id, { ...p, source: "category" });
  }
  return { invited, candidates: [...out.values()].slice(0, 20), invitedMe: false };
}

/** My published projects that have not been given to anyone yet; the choices for "Invite to a project" on a profile. */
export async function myOpenProjects(): Promise<{ id: string; title: string }[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("id,title").eq("author_id", uid).eq("kind", "need_help").eq("status", "published").order("created_at", { ascending: false }).limit(20);
  const posts = (data ?? []) as { id: string; title: string }[];
  if (posts.length === 0) return [];
  const { data: jobs } = await supabase.from("project_jobs").select("post_id").in("post_id", posts.map((p) => p.id)).in("status", ["accepted", "delivered", "confirmed"]);
  const taken = new Set(((jobs ?? []) as { post_id: string }[]).map((j) => j.post_id));
  return posts.filter((p) => !taken.has(p.id));
}

// Volunteer activities (migration 0025) --------------------------------------------------------------------------

const ACTIVITY_SELECT = `id,title,description,place,city,starts_at,ends_at,capacity,bring,status,conversation_id,organiser:profiles!activities_organiser_id_fkey(${AUTHOR})`;
type ActivityBase = Omit<ActivityRow, "organiser" | "joined" | "waitlist" | "mine"> & { organiser: Author | Author[] };

async function withStats(rows: ActivityBase[]): Promise<ActivityRow[]> {
  if (rows.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("activity_stats", { p_ids: rows.map((r) => r.id) });
  const stats = new Map<string, { joined: number; waitlist: number; mine: ActivityMine }>();
  for (const s of (data ?? []) as { activity_id: string; joined: number; waitlist: number; mine: ActivityMine }[]) stats.set(s.activity_id, s);
  return rows.map((r) => ({ ...r, organiser: one(r.organiser) as Author, joined: stats.get(r.id)?.joined ?? 0, waitlist: stats.get(r.id)?.waitlist ?? 0, mine: stats.get(r.id)?.mine ?? null }));
}

/** Open activities that have not ended, soonest first; optional province. */
export async function listActivities(city?: string): Promise<ActivityRow[]> {
  const supabase = await createClient();
  let query = supabase.from("activities").select(ACTIVITY_SELECT).eq("status", "open").gt("ends_at", new Date().toISOString()).order("starts_at").limit(60);
  if (city) query = query.eq("city", city);
  const { data } = await query;
  return withStats((data ?? []) as unknown as ActivityBase[]);
}

/** One activity; the organiser also gets the volunteer list. */
export async function getActivity(id: string): Promise<{ activity: ActivityRow; volunteers: ActivityVolunteer[]; isOrganiser: boolean } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const uid = await getUserId();
  const { data } = await supabase.from("activities").select(ACTIVITY_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const [activity] = await withStats([data as unknown as ActivityBase]);
  const isOrganiser = !!uid && activity.organiser.id === uid;
  let volunteers: ActivityVolunteer[] = [];
  if (isOrganiser) {
    const { data: rows } = await supabase
      .from("activity_members")
      .select(`status,hours,user:profiles!activity_members_user_id_fkey(${AUTHOR})`)
      .eq("activity_id", id)
      .order("joined_at");
    volunteers = ((rows ?? []) as unknown as { status: ActivityVolunteer["status"]; hours: number | null; user: Author | Author[] }[]).map((r) => ({ user: one(r.user) as Author, status: r.status, hours: r.hours }));
  }
  return { activity, volunteers, isOrganiser };
}

/** Confirmed volunteer activities and hours on a profile; zero when the person hides their record. */
export async function volunteerRecord(userId: string): Promise<{ activities: number; hours: number }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("volunteer_record", { p_user: userId });
  const row = (Array.isArray(data) ? data[0] : data) as { activities: number; hours: number | string } | null;
  return { activities: row?.activities ?? 0, hours: Number(row?.hours ?? 0) };
}

// Blocking (migration 0026) ---------------------------------------------------------------------------------

/** Did I block this person? (Only my own blocks are readable.) */
export async function iBlocked(userId: string): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("user_blocks").select("blocked_id").eq("blocker_id", uid).eq("blocked_id", userId).maybeSingle();
  return !!data;
}

export async function myBlocks(): Promise<BlockedPerson[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("user_blocks").select(`created_at,user:profiles!user_blocks_blocked_id_fkey(${AUTHOR})`).eq("blocker_id", uid).order("created_at", { ascending: false });
  return ((data ?? []) as unknown as { created_at: string; user: Author | Author[] }[]).map((r) => ({ user: one(r.user) as Author, created_at: r.created_at }));
}

/** My job alerts (migration 0028), newest first. */
export async function myJobAlerts(): Promise<JobAlertRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("job_alerts").select("id,category_id,city").eq("user_id", uid).order("created_at", { ascending: false });
  return (data ?? []) as JobAlertRow[];
}

/** Files of one company that the reader may see (row security decides: owners and managers all, members Team and Public). */
export async function companyDocuments(businessId: string): Promise<CompanyDoc[]> {
  if (!/^[0-9a-f-]{36}$/i.test(businessId)) return [];
  const { data } = await (await createClient())
    .from("business_documents")
    .select("id,business_id,name,mime,bytes,level,created_at,updated_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CompanyDoc[];
}

/** Public company page data. Works without a login; null when the page is off and the reader is not in the company. */
export async function companyPublic(id: string): Promise<CompanyPublic | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await (await createClient()).rpc("company_public", { p_id: id });
  return (data ?? null) as CompanyPublic | null;
}

export type AdminKpis = {
  people: { total: number; new_7d: number; new_30d: number; providers: number; identity_checked: number; with_record: number };
  market: { projects: number; projects_30d: number; projects_with_quote: number; quotes: number; quotes_30d: number; accepted: number; delivered: number; confirmed: number; cancelled: number; reviews: number; avg_stars: number | null; hours_to_first_quote: number | null };
  intake: { requests: number; requests_30d: number; applications: number; by_source: { source: string; n: number }[] };
  community: { companies: number; public_pages: number; open_activities: number; activity_joins: number; messages_7d: number; open_jobs: number };
  weekly: { week: string; signups: number; projects: number; quotes: number; confirmed: number }[];
};

/** Owner numbers (migration 0035). Null for anyone who is not an admin. */
export async function adminKpis(): Promise<AdminKpis | null> {
  const uid = await getUserId();
  if (!uid) return null;
  const { data } = await (await createClient()).rpc("admin_kpis");
  return (data ?? null) as AdminKpis | null;
}

/** Shifts of one company between two instants. Owner and managers get everyone's; a member only their own (row security). */
export async function teamShifts(businessId: string, fromIso: string, toIso: string): Promise<ShiftRow[]> {
  if (!/^[0-9a-f-]{36}$/i.test(businessId)) return [];
  const { data } = await (await createClient())
    .from("team_shifts")
    .select("id,user_id,starts_at,ends_at,note,clock_in_at,clock_out_at,absent,user:profiles!team_shifts_user_id_fkey(display_name)")
    .eq("business_id", businessId)
    .gte("starts_at", fromIso)
    .lt("starts_at", toIso)
    .order("starts_at");
  return ((data ?? []) as unknown as (Omit<ShiftRow, "person"> & { user: { display_name: string } | { display_name: string }[] | null })[]).map((r) => {
    const { user, ...rest } = r;
    return { ...rest, person: one(user)?.display_name ?? "?" };
  });
}

/** Tasks of one company: all for owner and managers, only the assigned ones for a member. */
export async function teamTasks(businessId: string): Promise<TaskRow[]> {
  if (!/^[0-9a-f-]{36}$/i.test(businessId)) return [];
  const { data } = await (await createClient())
    .from("team_tasks")
    .select("id,title,detail,assignee_id,status,due_on,created_at,assignee:profiles!team_tasks_assignee_id_fkey(display_name)")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(200);
  return ((data ?? []) as unknown as (Omit<TaskRow, "assignee"> & { assignee: { display_name: string } | { display_name: string }[] | null })[]).map((r) => ({ ...r, assignee: one(r.assignee)?.display_name ?? null }));
}

const INVOICE_COLS = "id,number,job_id,issuer_id,customer_id,issuer_name,customer_name,title,amount,currency,note,due_on,status,paid_method,paid_on,paid_ref,issued_at,claimed_at,received_at,void_at";
const asInvoice = (r: unknown): InvoiceRow => ({ ...(r as InvoiceRow), amount: Number((r as { amount: number | string }).amount) });

/** Invoices the signed-in person issued or received (row security). */
export async function listInvoices(): Promise<InvoiceRow[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const { data } = await (await createClient()).from("invoices").select(INVOICE_COLS).order("issued_at", { ascending: false }).limit(200);
  return (data ?? []).map(asInvoice);
}

export async function getInvoice(id: string): Promise<InvoiceRow | null> {
  const uid = await getUserId();
  if (!uid || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await (await createClient()).from("invoices").select(INVOICE_COLS).eq("id", id).maybeSingle();
  return data ? asInvoice(data) : null;
}

/** What a provider can still invoice on an accepted job: the agreed price minus invoices that are not void. */
export async function invoiceRoom(jobId: string): Promise<{ title: string; customer: string; agreed: number; used: number; currency: string; mine: boolean; status: string } | null> {
  const uid = await getUserId();
  if (!uid || !/^[0-9a-f-]{36}$/i.test(jobId)) return null;
  const supabase = await createClient();
  const { data: j } = await supabase.from("project_jobs").select("id,provider_id,customer_id,agreed_price,currency,status,post_id").eq("id", jobId).maybeSingle();
  if (!j) return null;
  const job = j as { provider_id: string; customer_id: string; agreed_price: number | string; currency: string; status: string; post_id: string };
  const [{ data: post }, { data: inv }, { data: cust }] = await Promise.all([
    supabase.from("posts").select("title").eq("id", job.post_id).maybeSingle(),
    supabase.from("invoices").select("amount").eq("job_id", jobId).neq("status", "void"),
    supabase.from("profiles").select("display_name").eq("id", job.customer_id).maybeSingle(),
  ]);
  const used = ((inv ?? []) as { amount: number | string }[]).reduce((n, r) => n + Number(r.amount), 0);
  return { title: (post as { title: string } | null)?.title ?? "", customer: (cust as { display_name: string } | null)?.display_name ?? "", agreed: Number(job.agreed_price), used, currency: job.currency, mine: job.provider_id === uid, status: job.status };
}

/** The signed-in person's own payout account, if they set one (migration 0040). */
export async function myPayoutAccount(): Promise<PayoutAccount | null> {
  const uid = await getUserId();
  if (!uid) return null;
  const { data } = await (await createClient()).from("payout_accounts").select("method,account_name,account_number,status,note,updated_at").eq("user_id", uid).maybeSingle();
  return (data ?? null) as PayoutAccount | null;
}

/** Public yes or no: approved payout account and a checked identity. */
export async function isPayoutVerified(userId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return false;
  const { data } = await (await createClient()).rpc("is_payout_verified", { p_user: userId });
  return data === true;
}
