"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CITIES, HAS_DISTRICTS } from "@/lib/cities";
import { createClient, getUserId } from "@/lib/supabase/server";
import { fieldErrors, formEntries, type FormState } from "@/lib/validation";
import { z } from "zod";

// Write helpers for the app. Each runs as the signed-in person; RLS and the security-definer functions in
// migration 0004 decide what is allowed. Anonymous visitors are sent to /login with a way back.

const uuid = /^[0-9a-f-]{36}$/i;

async function requireUser(next: string) {
  const uid = await getUserId();
  if (!uid) redirect(`/login?next=${encodeURIComponent(next)}`);
  return uid;
}

const text = (min: number, max: number) => z.string().trim().min(min, min <= 1 ? "Please fill in this field." : "Too short.").max(max, "Too long.");
const optional = (max: number) => z.string().trim().max(max, "Too long.").transform((v) => (v === "" ? null : v));

// Workspace -----------------------------------------------------------------------------------------------

export async function toggleCheer(postId: string, path: string) {
  if (!uuid.test(postId)) return;
  const uid = await requireUser(path);
  const supabase = await createClient();
  const { data } = await supabase.from("post_reactions").select("post_id").eq("post_id", postId).eq("user_id", uid).maybeSingle();
  if (data) await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", uid);
  else await supabase.from("post_reactions").insert({ post_id: postId, user_id: uid, reaction: "cheer" });
  revalidatePath(path);
}

export async function toggleKeepPost(postId: string, path: string) {
  if (!uuid.test(postId)) return;
  const uid = await requireUser(path);
  const supabase = await createClient();
  const { data } = await supabase.from("saved_posts").select("post_id").eq("post_id", postId).eq("user_id", uid).maybeSingle();
  if (data) await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", uid);
  else await supabase.from("saved_posts").insert({ post_id: postId, user_id: uid });
  revalidatePath(path);
}

const money = z.preprocess((v) => (v === "" || v == null ? null : Number(String(v).replace(/,/g, ""))), z.number({ error: "Must be a number." }).min(0).max(1_000_000).nullable());
const postSchema = z
  .object({
    kind: z.enum(["need_help", "offer_skill", "share_knowledge"]),
    title: text(3, 120),
    body: text(10, 3000),
    category_id: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable()),
    place: optional(80),
    price_text: optional(40),
    deliverables: z.string().max(2000, "Too long.").transform((v) => v.split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean).slice(0, 10)),
    deadline: z.string().transform((v) => (new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2}$").test(v) ? v : null)),
    remote: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
    budget_min: money,
    budget_max: money,
    invited_provider_id: z.string().transform((v) => (uuid.test(v) ? v : null)),
    open_now: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
    business_id: z.string().transform((v) => (uuid.test(v) ? v : null)),
  })
  .refine((d) => d.budget_max === null || d.budget_min === null || d.budget_max >= d.budget_min, { path: ["budget_max"], message: "Must not be lower than the first amount." });

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const uid = await requireUser("/app/post/new");
  const values = formEntries(formData, ["kind", "title", "body", "category_id", "place", "price_text", "deliverables", "deadline", "remote", "budget_min", "budget_max", "invited_provider_id", "open_now", "business_id"]);
  const parsed = postSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values, message: "Please check the highlighted fields." };
  const supabase = await createClient();
  const { invited_provider_id, open_now, business_id, ...fields } = parsed.data;
  const scope = fields.kind === "need_help" ? fields : { ...fields, deliverables: [], deadline: null, remote: false, budget_min: null, budget_max: null };
  // A rehire goes to one provider first; it opens to everyone after 24 hours unless the author opens it now.
  const invited = fields.kind === "need_help" && invited_provider_id && invited_provider_id !== uid ? invited_provider_id : null;
  const opens_at = invited && !open_now ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null;
  const { data, error } = await supabase.from("posts").insert({ ...scope, author_id: uid, status: "published", invited_provider_id: invited, opens_at, business_id }).select("id").single();
  if (error || !data) return { ok: false, values, message: "Something went wrong. Please try again." };
  revalidatePath("/app");
  redirect(`/app/post/${data.id}`);
}

export async function addComment(postId: string, formData: FormData) {
  if (!uuid.test(postId)) return;
  const uid = await requireUser(`/app/post/${postId}`);
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!body) return;
  const supabase = await createClient();
  await supabase.from("post_comments").insert({ post_id: postId, author_id: uid, body });
  revalidatePath(`/app/post/${postId}`);
}

// Connect, Request a quote, Message: all open or continue one conversation ----------------------------------

export async function startConversation(userId: string, formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const back = String(formData.get("back") ?? "/app");
  if (!uuid.test(userId)) return;
  await requireUser(back);
  const body = String(formData.get("body") ?? "").trim().slice(0, 3000);
  if (!body) return;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_conversation", { p_user: userId, p_body: body, p_post: uuid.test(postId) ? postId : null });
  if (error || !data) redirect(`${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent(error?.message ?? "failed")}`);
  redirect(`/app/messages/${data}`);
}

export async function sendMessage(conversationId: string, formData: FormData) {
  if (!uuid.test(conversationId)) return;
  const uid = await requireUser(`/app/messages/${conversationId}`);
  const body = String(formData.get("body") ?? "").trim().slice(0, 3000);
  if (!body) return;
  const supabase = await createClient();
  await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: uid, body });
  revalidatePath(`/app/messages/${conversationId}`);
}

// Services ------------------------------------------------------------------------------------------------

export async function toggleKeepProvider(providerId: string, path: string) {
  if (!uuid.test(providerId)) return;
  const uid = await requireUser(path);
  const supabase = await createClient();
  const { data } = await supabase.from("saved_providers").select("provider_id").eq("provider_id", providerId).eq("user_id", uid).maybeSingle();
  if (data) await supabase.from("saved_providers").delete().eq("provider_id", providerId).eq("user_id", uid);
  else await supabase.from("saved_providers").insert({ provider_id: providerId, user_id: uid });
  revalidatePath(path);
}

// Jobs ----------------------------------------------------------------------------------------------------

const jobSchema = z.object({
  title: text(3, 120),
  description: text(10, 3000),
  city: optional(80),
  job_type: z.enum(["freelance", "project"]),
  pay_amount: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number({ error: "Must be a number." }).min(0).nullable()),
  pay_unit: z.enum(["hour", "day", "project"]),
  remote_available: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  business_id: z.string().transform((v) => (uuid.test(v) ? v : null)),
});

export async function createJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const uid = await requireUser("/app/jobs/new");
  const values = formEntries(formData, ["title", "description", "city", "job_type", "pay_amount", "pay_unit", "remote_available", "business_id"]);
  const parsed = jobSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values, message: "Please check the highlighted fields." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("jobs").insert({ ...parsed.data, poster_id: uid, status: "draft" }).select("id").single();
  if (error || !data) return { ok: false, values, message: "Something went wrong. Please try again." };
  const { error: pubError } = await supabase.rpc("publish_job", { p_id: data.id });
  if (pubError) return { ok: false, values, message: "Something went wrong. Please try again." };
  revalidatePath("/app/jobs");
  redirect(`/app/jobs/${data.id}`);
}

export async function applyToJob(jobId: string, formData: FormData) {
  if (!uuid.test(jobId)) return;
  const uid = await requireUser(`/app/jobs/${jobId}`);
  const cover = String(formData.get("cover_note") ?? "").trim().slice(0, 2000) || null;
  const supabase = await createClient();
  await supabase.from("job_applications").insert({ job_id: jobId, applicant_id: uid, cover_note: cover });
  revalidatePath(`/app/jobs/${jobId}`);
}

// Profile -------------------------------------------------------------------------------------------------

const profileSchema = z.object({
  display_name: text(1, 80),
  role_line: optional(80),
  bio: optional(1000),
  city: z.preprocess((v) => (v === "" || v == null ? null : v), z.enum(CITIES).nullable()),
  district: optional(60),
  is_available: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  primary_category_id: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable()),
  price_from: optional(40),
  remote: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  skills: z.string().max(600, "Too long."),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const uid = await requireUser("/app/profile/edit");
  const values = formEntries(formData, ["display_name", "role_line", "bio", "city", "district", "is_available", "primary_category_id", "price_from", "remote", "skills"]);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values, message: "Please check the highlighted fields." };
  const { skills, ...profile } = parsed.data;
  if (profile.city !== HAS_DISTRICTS) profile.district = null;
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(profile).eq("id", uid);
  if (error) return { ok: false, values, message: "Something went wrong. Please try again." };
  const names = skills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 10);
  await supabase.rpc("set_my_skills", { p_names: names });
  revalidatePath("/app/profile");
  revalidatePath("/app/services");
  return { ok: true, message: "Saved." };
}

/** Called after the browser uploaded the file to the avatars bucket. */
export async function setAvatar(path: string) {
  const uid = await requireUser("/app/profile");
  if (!path.startsWith(`${uid}/`)) return;
  const supabase = await createClient();
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", uid);
  revalidatePath("/app/profile");
}

const PORTFOLIO_MAX = 12;

/** Called after the browser uploaded the image to portfolio/<uid>/...; records it with an optional caption. */
export async function addPortfolioItem(path: string, caption: string) {
  const uid = await requireUser("/app/profile/edit");
  if (!path.startsWith(`${uid}/`)) return;
  const supabase = await createClient();
  const { count } = await supabase.from("portfolio_items").select("id", { count: "exact", head: true }).eq("provider_id", uid);
  if ((count ?? 0) >= PORTFOLIO_MAX) {
    await supabase.storage.from("portfolio").remove([path]);
    return;
  }
  await supabase.from("portfolio_items").insert({ provider_id: uid, image_path: path, caption: caption.trim().slice(0, 300) || null, sort_order: count ?? 0 });
  revalidatePath("/app/profile/edit");
  revalidatePath(`/app/providers/${uid}`);
}

export async function removePortfolioItem(id: string) {
  const uid = await requireUser("/app/profile/edit");
  const supabase = await createClient();
  const { data } = await supabase.from("portfolio_items").delete().eq("id", id).eq("provider_id", uid).select("image_path").maybeSingle();
  if (data?.image_path) await supabase.storage.from("portfolio").remove([data.image_path]);
  revalidatePath("/app/profile/edit");
  revalidatePath(`/app/providers/${uid}`);
}

export async function setAvailableThisWeek(formData: FormData) {
  await requireUser("/app/profile");
  const on = String(formData.get("on") ?? "") === "1";
  const supabase = await createClient();
  await supabase.rpc("set_available_this_week", { p_on: on });
  revalidatePath("/app/profile");
  revalidatePath("/app/services");
}

/** Settings: show my confirmed jobs on my profile (and my name on the other party's record). */
export async function setRecordPublic(formData: FormData) {
  const uid = await requireUser("/app/settings");
  const on = String(formData.get("on") ?? "") === "1";
  const supabase = await createClient();
  await supabase.from("profiles").update({ record_public: on }).eq("id", uid);
  revalidatePath("/app/settings");
}

export async function setEmailNotifications(formData: FormData) {
  await requireUser("/app/settings");
  const on = String(formData.get("on") ?? "") === "1";
  const supabase = await createClient();
  await supabase.rpc("set_email_notifications", { p_on: on });
  revalidatePath("/app/settings");
}

/** This device wants phone notifications: one row per browser subscription, replaced if the endpoint repeats. */
export async function savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) {
  const uid = await requireUser("/app/settings");
  if (!sub.endpoint.startsWith("https://") || sub.endpoint.length > 1000) return;
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("user_id", uid).eq("endpoint", sub.endpoint);
  await supabase.from("push_subscriptions").insert({ user_id: uid, endpoint: sub.endpoint, p256dh: sub.p256dh.slice(0, 200), auth: sub.auth.slice(0, 100), user_agent: sub.userAgent?.slice(0, 300) ?? null });
}

export async function removePushSubscription(endpoint: string) {
  const uid = await requireUser("/app/settings");
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("user_id", uid).eq("endpoint", endpoint);
}

/** Add a company (migration 0020): name, kind, city. Then its page, where jobs and projects are posted under it. */
export async function createCompany(formData: FormData) {
  await requireUser("/app/profile/companies/new");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const kind = String(formData.get("kind") ?? "").trim().slice(0, 80);
  const cityRaw = String(formData.get("city") ?? "");
  const city = (CITIES as readonly string[]).includes(cityRaw) ? cityRaw : "";
  if (name.length < 2) redirect("/app/profile/companies/new?error=1");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_business", { p_name: name, p_kind: kind, p_city: city });
  if (error || !data) redirect("/app/profile/companies/new?error=1");
  revalidatePath("/app/profile");
  redirect(`/app/profile/companies/${data}`);
}

export async function markNotificationsRead() {
  const uid = await requireUser("/app/profile");
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", uid).is("read_at", null);
  revalidatePath("/app/profile");
  revalidatePath("/app/notifications");
}

// Quotes, job record, reviews (Phase 2 core loop) -----------------------------------------------------------

async function rpcThenBack(path: string, fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) redirect(`${path}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(path);
  revalidatePath("/app");
  redirect(path);
}

export async function sendQuote(postId: string, formData: FormData) {
  if (!uuid.test(postId)) return;
  const uid = await requireUser(`/app/post/${postId}`);
  const price = Number(String(formData.get("price") ?? "").replace(/,/g, ""));
  const daysRaw = String(formData.get("days") ?? "").trim();
  const days = daysRaw === "" ? null : Number(daysRaw);
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;
  const path = `/app/post/${postId}`;
  if (!(price >= 0) || (days !== null && !(days >= 1 && days <= 365))) redirect(`${path}?error=${encodeURIComponent("Must be a number.")}`);
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").insert({ post_id: postId, provider_id: uid, price, days, note });
  if (error) redirect(`${path}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(path);
  redirect(path);
}

export async function acceptQuote(postId: string, quoteId: string) {
  if (!uuid.test(postId) || !uuid.test(quoteId)) return;
  await requireUser(`/app/post/${postId}`);
  await rpcThenBack(`/app/post/${postId}`, "accept_quote", { p_quote: quoteId });
}
export async function declineQuote(postId: string, quoteId: string) {
  if (!uuid.test(postId) || !uuid.test(quoteId)) return;
  await requireUser(`/app/post/${postId}`);
  await rpcThenBack(`/app/post/${postId}`, "decline_quote", { p_quote: quoteId });
}
export async function withdrawQuote(postId: string, quoteId: string) {
  if (!uuid.test(postId) || !uuid.test(quoteId)) return;
  await requireUser(`/app/post/${postId}`);
  await rpcThenBack(`/app/post/${postId}`, "withdraw_quote", { p_quote: quoteId });
}
export async function markDelivered(postId: string, jobId: string) {
  if (!uuid.test(postId) || !uuid.test(jobId)) return;
  await requireUser(`/app/post/${postId}`);
  await rpcThenBack(`/app/post/${postId}`, "mark_delivered", { p_job: jobId });
}
export async function confirmCompletion(postId: string, jobId: string) {
  if (!uuid.test(postId) || !uuid.test(jobId)) return;
  await requireUser(`/app/post/${postId}`);
  await rpcThenBack(`/app/post/${postId}`, "confirm_completion", { p_job: jobId });
}
export async function cancelJob(postId: string, jobId: string, formData: FormData) {
  if (!uuid.test(postId) || !uuid.test(jobId)) return;
  await requireUser(`/app/post/${postId}`);
  await rpcThenBack(`/app/post/${postId}`, "cancel_job", { p_job: jobId, p_note: String(formData.get("note") ?? "").trim().slice(0, 500) || null });
}
export async function leaveReview(postId: string, jobId: string, formData: FormData) {
  if (!uuid.test(postId) || !uuid.test(jobId)) return;
  await requireUser(`/app/post/${postId}`);
  const stars = Number(formData.get("stars"));
  if (!(stars >= 1 && stars <= 5)) return;
  const skills = formData.getAll("skills").map(String).filter((s) => s.length > 0 && s.length <= 60).slice(0, 3);
  if (skills.length) await (await createClient()).rpc("endorse", { p_job: jobId, p_skills: skills });
  await rpcThenBack(`/app/post/${postId}`, "leave_review", { p_job: jobId, p_stars: stars, p_comment: String(formData.get("comment") ?? "").trim().slice(0, 1000) });
}

// Reports and disputes (Phase 2) ------------------------------------------------------------------------------

const REPORT_TYPES = ["post", "comment", "user", "job", "message"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

/** Report a post, comment, job, message or person. One open report per target per person; the admin queue takes it from there. */
export async function fileReport(type: ReportType, targetId: string, path: string, formData: FormData) {
  if (!REPORT_TYPES.includes(type) || !uuid.test(targetId) || !path.startsWith("/app/")) return;
  await requireUser(path);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  const supabase = await createClient();
  const { error } = await supabase.rpc("file_report", { p_type: type, p_id: targetId, p_reason: reason });
  redirect(error ? `${path}?error=${encodeURIComponent(error.message)}` : `${path}?reported=1`);
}

export async function openDispute(postId: string, jobId: string, formData: FormData) {
  if (!uuid.test(postId) || !uuid.test(jobId)) return;
  await requireUser(`/app/post/${postId}`);
  await rpcThenBack(`/app/post/${postId}`, "open_dispute", { p_job: jobId, p_reason: String(formData.get("reason") ?? "").trim().slice(0, 2000) });
}
