"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CITIES, HAS_DISTRICTS } from "@/lib/cities";
import { phnomPenhToIso } from "@/lib/datetime";
import { createClient, getUserId } from "@/lib/supabase/server";
import { getMe } from "@/lib/app/queries";
import { fieldErrors, formEntries, type FormState } from "@/lib/validation";
import { z } from "zod";
import { requireFeature } from "@/lib/app/features";

// Write helpers for the app. Each runs as the signed-in person; RLS and the security-definer functions in
// migration 0004 decide what is allowed. Anonymous visitors are sent to /login with a way back.

const uuid = /^[0-9a-f-]{36}$/i;

async function requireUser(next: string) {
  const uid = await getUserId();
  if (!uid) redirect(`/login?next=${encodeURIComponent(next)}`);
  // A paused account cannot write anything; the app layout shows the paused notice.
  const me = await getMe();
  if (me?.paused_at) redirect("/app");
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

/** "Say hello": one short request to someone who has not opened messages (migration 0022). */
export async function sendHello(userId: string, formData: FormData) {
  const back = String(formData.get("back") ?? "/app");
  if (!uuid.test(userId)) return;
  await requireUser(back);
  const body = String(formData.get("body") ?? "").trim().slice(0, 300);
  if (!body) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_hello", { p_user: userId, p_body: body });
  const sep = back.includes("?") ? "&" : "?";
  if (error) redirect(`${back}${sep}error=${error.message.includes("too many") ? "limit" : encodeURIComponent(error.message)}`);
  revalidatePath(back);
  redirect(back);
}

/** Answer a request from the Messages tab: accept opens the conversation, decline is silent. */
export async function answerHello(requestId: string, accept: boolean) {
  if (!uuid.test(requestId)) return;
  await requireUser("/app/messages");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("answer_hello", { p_request: requestId, p_accept: accept });
  revalidatePath("/app/messages");
  if (!error && accept && data) redirect(`/app/messages/${data}`);
  redirect("/app/messages");
}

// Group messages (migration 0023) ---------------------------------------------------------------------------

const memberIds = (formData: FormData) => formData.getAll("members").map(String).filter((v) => uuid.test(v));

export async function createGroup(formData: FormData) {
  await requireUser("/app/messages/new-group");
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const post = String(formData.get("post") ?? "");
  const back = `/app/messages/new-group${uuid.test(post) ? `?post=${post}&` : "?"}error=1`;
  const members = memberIds(formData);
  if (title.length < 2 || members.length === 0) redirect(back);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", { p_title: title, p_members: members, p_post: uuid.test(post) ? post : null });
  if (error || !data) redirect(back);
  revalidatePath("/app/messages");
  redirect(`/app/messages/${data}`);
}

export async function addGroupMembers(conversationId: string, formData: FormData) {
  if (!uuid.test(conversationId)) return;
  await requireUser(`/app/messages/${conversationId}`);
  const members = memberIds(formData);
  if (members.length) await (await createClient()).rpc("add_group_members", { p_conv: conversationId, p_members: members });
  revalidatePath(`/app/messages/${conversationId}`);
}

export async function removeGroupMember(conversationId: string, userId: string) {
  if (!uuid.test(conversationId) || !uuid.test(userId)) return;
  await requireUser(`/app/messages/${conversationId}`);
  await (await createClient()).rpc("remove_group_member", { p_conv: conversationId, p_user: userId });
  revalidatePath(`/app/messages/${conversationId}`);
}

export async function leaveGroup(conversationId: string) {
  if (!uuid.test(conversationId)) return;
  await requireUser(`/app/messages/${conversationId}`);
  await (await createClient()).rpc("leave_group", { p_conv: conversationId });
  revalidatePath("/app/messages");
  redirect("/app/messages");
}

// Invitations to a project (migration 0024) --------------------------------------------------------------------

/** From the project page: invite the ticked providers. */
export async function inviteProviders(postId: string, formData: FormData) {
  if (!uuid.test(postId)) return;
  await requireUser(`/app/post/${postId}`);
  const providers = formData.getAll("providers").map(String).filter((v) => uuid.test(v)).slice(0, 10);
  if (providers.length) await (await createClient()).rpc("invite_providers", { p_post: postId, p_providers: providers });
  revalidatePath(`/app/post/${postId}`);
}

/** From a provider's profile: invite this one person to one of my open projects. */
export async function inviteToProject(providerId: string, formData: FormData) {
  const back = String(formData.get("back") ?? "/app");
  const postId = String(formData.get("post") ?? "");
  if (!uuid.test(providerId) || !uuid.test(postId)) return;
  await requireUser(back);
  const { data, error } = await (await createClient()).rpc("invite_providers", { p_post: postId, p_providers: [providerId] });
  const sep = back.includes("?") ? "&" : "?";
  if (error) redirect(`${back}${sep}error=${encodeURIComponent(error.message)}`);
  revalidatePath(back);
  redirect(`${back}${sep}invited=${data ? "1" : "0"}`);
}

// Volunteer activities (migration 0025) -----------------------------------------------------------------------

export async function createActivity(formData: FormData) {
  await requireUser("/app/activities/new");
  const f = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const starts = phnomPenhToIso(f("date", 10), f("start", 5));
  const ends = phnomPenhToIso(f("date", 10), f("end", 5));
  const capacity = Math.round(Number(f("capacity", 4)));
  const cityRaw = f("city", 40);
  const bad = !starts || !ends || f("title", 120).length < 3 || f("description", 3000).length < 10 || !(capacity >= 1 && capacity <= 100);
  if (bad) redirect("/app/activities/new?error=1");
  // An end time before the start means it runs past midnight: move the end to the next day.
  const endIso = new Date(ends!) > new Date(starts!) ? ends! : new Date(new Date(ends!).getTime() + 24 * 3600 * 1000).toISOString();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_activity", {
    p_title: f("title", 120), p_description: f("description", 3000), p_place: f("place", 120),
    p_city: (CITIES as readonly string[]).includes(cityRaw) ? cityRaw : "", p_starts: starts, p_ends: endIso, p_capacity: capacity, p_bring: f("bring", 500),
  });
  if (error || !data) redirect(`/app/activities/new?error=${error?.message.includes("too many") ? "limit" : error?.message.includes("identity check") ? "identity" : "1"}`);
  const company = f("business", 36);
  if (uuid.test(company)) await supabase.rpc("link_activity_company", { p_activity: data, p_business: company });
  revalidatePath("/app/activities");
  redirect(`/app/activities/${data}`);
}

async function activityRpc(id: string, fn: string, args: Record<string, unknown> = {}) {
  if (!uuid.test(id)) return;
  await requireUser(`/app/activities/${id}`);
  await (await createClient()).rpc(fn, { p_activity: id, ...args });
  revalidatePath(`/app/activities/${id}`);
  revalidatePath("/app/activities");
}

export async function joinActivity(id: string) {
  await activityRpc(id, "join_activity");
}

export async function leaveActivity(id: string) {
  await activityRpc(id, "leave_activity");
}

export async function cancelActivity(id: string) {
  await activityRpc(id, "cancel_activity");
}

export async function confirmVolunteer(activityId: string, userId: string, present: boolean, formData: FormData) {
  if (!uuid.test(userId)) return;
  const raw = String(formData.get("hours") ?? "").trim();
  const hours = raw === "" ? null : Number(raw);
  await activityRpc(activityId, "confirm_volunteer", { p_user: userId, p_present: present, p_hours: hours !== null && Number.isFinite(hours) ? hours : null });
}

// Blocking (migration 0026): nobody is told; both directions stop messages, requests, invitations and groups.
export async function blockUser(userId: string, path: string) {
  if (!uuid.test(userId)) return;
  const uid = await requireUser(path);
  if (uid === userId) return;
  await (await createClient()).from("user_blocks").upsert({ blocker_id: uid, blocked_id: userId });
  revalidatePath(path);
  revalidatePath("/app/messages");
}

export async function unblockUser(userId: string, path: string) {
  if (!uuid.test(userId)) return;
  const uid = await requireUser(path);
  await (await createClient()).from("user_blocks").delete().eq("blocker_id", uid).eq("blocked_id", userId);
  revalidatePath(path);
  revalidatePath("/app/messages");
}

// Job alerts (migration 0028) --------------------------------------------------------------------------------

export async function addJobAlert(formData: FormData) {
  await requireUser("/app/jobs/alerts");
  const cat = Number(formData.get("category") ?? "");
  const cityRaw = String(formData.get("city") ?? "");
  const city = (CITIES as readonly string[]).includes(cityRaw) ? cityRaw : "";
  const category = Number.isInteger(cat) && cat > 0 ? cat : null;
  if (category === null && !city) redirect("/app/jobs/alerts?error=1");
  const { error } = await (await createClient()).rpc("add_job_alert", { p_category: category, p_city: city });
  revalidatePath("/app/jobs/alerts");
  redirect(`/app/jobs/alerts${error ? "?error=" + (error.message.includes("too many") ? "limit" : "1") : ""}`);
}

export async function removeJobAlert(id: string) {
  if (!uuid.test(id)) return;
  const uid = await requireUser("/app/jobs/alerts");
  await (await createClient()).from("job_alerts").delete().eq("id", id).eq("user_id", uid);
  revalidatePath("/app/jobs/alerts");
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
  category_id: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable()),
});

export async function createJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const uid = await requireUser("/app/jobs/new");
  const values = formEntries(formData, ["title", "description", "city", "job_type", "pay_amount", "pay_unit", "remote_available", "business_id", "category_id"]);
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

export async function setNotificationGroup(group: string, formData: FormData) {
  if (!["projects", "messages", "activities", "reviews", "team", "money"].includes(group)) return;
  await requireUser("/app/settings");
  const on = String(formData.get("on") ?? "") === "1";
  await (await createClient()).rpc("set_notification_group", { p_group: group, p_on: on });
  revalidatePath("/app/settings");
}

export async function setReminders(formData: FormData) {
  await requireUser("/app/settings");
  const on = String(formData.get("on") ?? "") === "1";
  await (await createClient()).rpc("set_reminders", { p_on: on });
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

// Company team (migration 0031) -----------------------------------------------------------------------------

export async function inviteToBusiness(businessId: string, formData: FormData) {
  if (!uuid.test(businessId)) return;
  await requireUser(`/app/profile/companies/${businessId}`);
  const role = String(formData.get("role") ?? "member") === "manager" ? "manager" : "member";
  const title = String(formData.get("job_title") ?? "").trim().slice(0, 80);
  const duties = String(formData.get("duties") ?? "").trim().slice(0, 1000);
  const rateRaw = String(formData.get("rate") ?? "").trim();
  const rate = rateRaw !== "" && Number.isFinite(Number(rateRaw)) && Number(rateRaw) >= 0 ? Number(rateRaw) : null;
  const unit = ["hour", "day", "month"].includes(String(formData.get("rate_unit"))) ? String(formData.get("rate_unit")) : "hour";
  const supabase = await createClient();
  for (const id of formData.getAll("people").map(String).filter((v) => uuid.test(v)).slice(0, 10)) {
    await supabase.rpc("invite_to_business", { p_business: businessId, p_user: id, p_role: role, p_title: title || null, p_duties: duties || null, p_rate: rate, p_unit: unit });
  }
  revalidatePath(`/app/profile/companies/${businessId}`);
}

export async function answerBusinessInvitation(invitationId: string, accept: boolean) {
  if (!uuid.test(invitationId)) return;
  await requireUser("/app/profile/companies/invites");
  const { data } = await (await createClient()).rpc("answer_business_invitation", { p_invitation: invitationId, p_accept: accept });
  revalidatePath("/app/profile");
  redirect(accept && data ? `/app/profile/companies/${data}` : "/app/profile/companies/invites");
}

export async function removeBusinessMember(businessId: string, userId: string) {
  if (!uuid.test(businessId) || !uuid.test(userId)) return;
  const uid = await requireUser(`/app/profile/companies/${businessId}`);
  await (await createClient()).rpc("remove_business_member", { p_business: businessId, p_user: userId });
  revalidatePath("/app/profile");
  if (userId === uid) redirect("/app/profile");
  revalidatePath(`/app/profile/companies/${businessId}`);
}

export async function setBusinessRole(businessId: string, userId: string, role: "manager" | "member") {
  if (!uuid.test(businessId) || !uuid.test(userId)) return;
  await requireUser(`/app/profile/companies/${businessId}`);
  await (await createClient()).rpc("set_business_role", { p_business: businessId, p_user: userId, p_role: role });
  revalidatePath(`/app/profile/companies/${businessId}`);
}

// Terms of work and pay records (migration 0032): private to the owner and the person --------------------------

export async function setMemberTerms(businessId: string, userId: string, formData: FormData) {
  if (!uuid.test(businessId) || !uuid.test(userId)) return;
  await requireUser(`/app/profile/companies/${businessId}/terms`);
  const rateRaw = String(formData.get("rate") ?? "").trim();
  const rate = rateRaw !== "" && Number.isFinite(Number(rateRaw)) && Number(rateRaw) >= 0 ? Number(rateRaw) : null;
  const unit = ["hour", "day", "month"].includes(String(formData.get("rate_unit"))) ? String(formData.get("rate_unit")) : "hour";
  await (await createClient()).rpc("set_member_terms", {
    p_business: businessId, p_user: userId,
    p_title: String(formData.get("job_title") ?? "").trim().slice(0, 80), p_duties: String(formData.get("duties") ?? "").trim().slice(0, 1000),
    p_rate: rate, p_unit: unit,
  });
  revalidatePath(`/app/profile/companies/${businessId}/terms`);
  revalidatePath(`/app/profile/companies/${businessId}`);
}

export async function addPayRecord(businessId: string, userId: string, formData: FormData) {
  if (!uuid.test(businessId) || !uuid.test(userId)) return;
  await requireUser(`/app/profile/companies/${businessId}/terms`);
  const date = (k: string) => (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(formData.get(k) ?? "")) ? String(formData.get(k)) : null);
  const from = date("from");
  const to = date("to");
  const quantity = Number(String(formData.get("quantity") ?? ""));
  if (!from || !to || !(quantity > 0)) return;
  await (await createClient()).rpc("add_pay_record", { p_business: businessId, p_user: userId, p_from: from, p_to: to, p_quantity: quantity, p_note: String(formData.get("note") ?? "").trim().slice(0, 300) });
  revalidatePath(`/app/profile/companies/${businessId}/terms`);
}

export async function markPayPaid(businessId: string, recordId: string, formData: FormData) {
  if (!uuid.test(businessId) || !uuid.test(recordId)) return;
  await requireUser(`/app/profile/companies/${businessId}/terms`);
  const paidOn = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(formData.get("paid_on") ?? "")) ? String(formData.get("paid_on")) : null;
  await (await createClient()).rpc("mark_pay_paid", { p_record: recordId, p_paid_on: paidOn, p_note: String(formData.get("note") ?? "").trim().slice(0, 300) });
  revalidatePath(`/app/profile/companies/${businessId}/terms`);
}

export async function deletePayRecord(businessId: string, recordId: string) {
  if (!uuid.test(businessId) || !uuid.test(recordId)) return;
  await requireUser(`/app/profile/companies/${businessId}/terms`);
  await (await createClient()).rpc("delete_pay_record", { p_record: recordId });
  revalidatePath(`/app/profile/companies/${businessId}/terms`);
}

export async function openBusinessChat(businessId: string) {
  if (!uuid.test(businessId)) return;
  await requireUser(`/app/profile/companies/${businessId}`);
  const { data } = await (await createClient()).rpc("open_business_chat", { p_business: businessId });
  redirect(data ? `/app/messages/${data}` : `/app/profile/companies/${businessId}`);
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

const REPORT_TYPES = ["post", "comment", "user", "job", "message", "company"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

/** Report a post, comment, job, message or person. One open report per target per person; the admin queue takes it from there. */
export async function fileReport(type: ReportType, targetId: string, path: string, formData: FormData) {
  if (!REPORT_TYPES.includes(type) || !uuid.test(targetId) || !(path.startsWith("/app/") || path.startsWith("/companies/"))) return;
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

// Company documents and the public company page (migration 0033). Only the owner publishes.
export async function setCompanyPage(business: string, formData: FormData) {
  if (!uuid.test(business)) return;
  await requireUser(`/app/profile/companies/${business}`);
  const about = String(formData.get("about") ?? "").slice(0, 500);
  const on = String(formData.get("public") ?? "") === "1";
  const { error } = await (await createClient()).rpc("set_company_page", { p_business: business, p_about: about, p_public: on });
  revalidatePath(`/app/profile/companies/${business}`);
  revalidatePath(`/companies/${business}`);
  redirect(`/app/profile/companies/${business}${error ? "?error=page" : "?saved=1"}`);
}

export async function setDocumentLevel(business: string, doc: string, level: string) {
  if (!uuid.test(business) || !uuid.test(doc) || !["private", "team", "public"].includes(level)) return;
  const back = `/app/profile/companies/${business}/documents`;
  await requireUser(back);
  const { error } = await (await createClient()).rpc("set_document_level", { p_doc: doc, p_level: level });
  revalidatePath(back);
  revalidatePath(`/companies/${business}`);
  redirect(error ? `${back}?error=1` : back);
}

export async function deleteCompanyDocument(business: string, doc: string) {
  if (!uuid.test(business) || !uuid.test(doc)) return;
  const back = `/app/profile/companies/${business}/documents`;
  await requireUser(back);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_company_document", { p_doc: doc });
  if (!error && typeof data === "string") await supabase.storage.from("company-files").remove([data]);
  revalidatePath(back);
  revalidatePath(`/companies/${business}`);
  redirect(error ? `${back}?error=1` : back);
}

/** Called by the browser right after it uploaded the file to the company-files bucket. The file starts as Private. */
export async function registerCompanyDocument(business: string, file: { path: string; name: string; mime: string; bytes: number }): Promise<{ ok: boolean }> {
  if (!uuid.test(business)) return { ok: false };
  await requireUser(`/app/profile/companies/${business}/documents`);
  const { error } = await (await createClient()).rpc("add_company_document", { p_business: business, p_name: file.name, p_path: file.path, p_mime: file.mime, p_bytes: Math.round(file.bytes) });
  revalidatePath(`/app/profile/companies/${business}/documents`);
  return { ok: !error };
}

/** A member chooses whether this company shows as "Works at" on their own public profile (migration 0036). */
export async function setShowOnProfile(business: string, formData: FormData) {
  if (!uuid.test(business)) return;
  const back = `/app/profile/companies/${business}`;
  const uid = await requireUser(back);
  await (await createClient()).rpc("set_show_on_profile", { p_business: business, p_show: String(formData.get("show") ?? "") === "1" });
  revalidatePath(back);
  revalidatePath(`/providers/${uid}`);
  redirect(back);
}

// Team shifts and tasks (migration 0037). Owner and managers plan; a member acts on their own.
const teamBack = (business: string, page: "schedule" | "tasks") => `/app/profile/companies/${business}/${page}`;

export async function addTeamShift(business: string, formData: FormData) {
  if (!uuid.test(business)) return;
  const back = teamBack(business, "schedule");
  await requireUser(back);
  const f = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const user = f("person", 36);
  const day = f("date", 10);
  const starts = phnomPenhToIso(day, f("start", 5));
  let ends = phnomPenhToIso(day, f("end", 5));
  if (!uuid.test(user) || !starts || !ends) redirect(`${back}?error=1`);
  // An end before the start means the shift runs past midnight.
  if (new Date(ends!) <= new Date(starts!)) ends = new Date(new Date(ends!).getTime() + 24 * 3600 * 1000).toISOString();
  const { error } = await (await createClient()).rpc("add_team_shift", { p_business: business, p_user: user, p_starts: starts, p_ends: ends, p_note: f("note", 200) });
  revalidatePath(back);
  redirect(`${back}?week=${day}${error ? (error.message.includes("overlap") ? "&error=overlap" : "&error=1") : ""}`);
}

export async function deleteTeamShift(business: string, shift: string, week: string) {
  if (!uuid.test(business) || !uuid.test(shift)) return;
  const back = teamBack(business, "schedule");
  await requireUser(back);
  await (await createClient()).rpc("delete_team_shift", { p_shift: shift });
  revalidatePath(back);
  redirect(`${back}?week=${/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(week) ? week : ""}`);
}

export async function clockShift(business: string, shift: string, action: string, week: string) {
  if (!uuid.test(business) || !uuid.test(shift) || !["in", "out", "absent", "reset"].includes(action)) return;
  const back = teamBack(business, "schedule");
  await requireUser(back);
  const { error } = await (await createClient()).rpc("clock_shift", { p_shift: shift, p_action: action });
  revalidatePath(back);
  const w = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(week) ? `week=${week}` : "";
  redirect(`${back}?${w}${error ? `${w ? "&" : ""}error=clock` : ""}`);
}

export async function addTeamTask(business: string, formData: FormData) {
  if (!uuid.test(business)) return;
  const back = teamBack(business, "tasks");
  await requireUser(back);
  const f = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const assignee = f("assignee", 36);
  const due = f("due", 10);
  if (f("title", 120).length < 2) redirect(`${back}?error=1`);
  const { error } = await (await createClient()).rpc("add_team_task", {
    p_business: business, p_title: f("title", 120), p_detail: f("detail", 500),
    p_assignee: uuid.test(assignee) ? assignee : null, p_due: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(due) ? due : null,
  });
  revalidatePath(back);
  redirect(error ? `${back}?error=1` : back);
}

export async function setTaskStatus(business: string, task: string, status: string) {
  if (!uuid.test(business) || !uuid.test(task) || !["todo", "doing", "done"].includes(status)) return;
  const back = teamBack(business, "tasks");
  await requireUser(back);
  await (await createClient()).rpc("set_task_status", { p_task: task, p_status: status });
  revalidatePath(back);
  redirect(back);
}

export async function deleteTeamTask(business: string, task: string) {
  if (!uuid.test(business) || !uuid.test(task)) return;
  const back = teamBack(business, "tasks");
  await requireUser(back);
  await (await createClient()).rpc("delete_team_task", { p_task: task });
  revalidatePath(back);
  redirect(back);
}

// Invoices and payment records (migration 0039). Records only: Piron Work never moves money.
const PAY_METHODS = ["cash", "bank", "aba", "wing", "other"];
const isoDay = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export async function createInvoice(formData: FormData) {
  await requireFeature("payments");
  const job = String(formData.get("job") ?? "");
  if (!uuid.test(job)) return;
  const back = `/app/invoices/new?job=${job}`;
  await requireUser(back);
  const amount = Number(String(formData.get("amount") ?? "").replace(/,/g, ""));
  const due = String(formData.get("due") ?? "");
  if (!(amount > 0)) redirect(`${back}&error=1`);
  const { data, error } = await (await createClient()).rpc("create_invoice", {
    p_job: job, p_amount: amount, p_due: isoDay.test(due) ? due : null, p_note: String(formData.get("note") ?? "").trim().slice(0, 500),
  });
  if (error || !data) redirect(`${back}&error=${error?.message.includes("over the agreed") ? "over" : "1"}`);
  revalidatePath("/app/invoices");
  redirect(`/app/invoices/${data}`);
}

async function invoiceRpc(id: string, fn: string, args: Record<string, unknown> = {}) {
  if (!uuid.test(id)) return;
  await requireFeature("payments");
  const back = `/app/invoices/${id}`;
  await requireUser(back);
  const { error } = await (await createClient()).rpc(fn, { p_invoice: id, ...args });
  revalidatePath(back);
  revalidatePath("/app/invoices");
  redirect(error ? `${back}?error=1` : back);
}

export async function markInvoicePaid(id: string, formData: FormData) {
  const method = String(formData.get("method") ?? "");
  const paidOn = String(formData.get("paid_on") ?? "");
  if (!PAY_METHODS.includes(method)) return;
  await invoiceRpc(id, "mark_invoice_paid", { p_method: method, p_paid_on: isoDay.test(paidOn) ? paidOn : null, p_ref: String(formData.get("ref") ?? "").trim().slice(0, 60) });
}

export async function confirmInvoicePayment(id: string, formData: FormData) {
  const method = String(formData.get("method") ?? "");
  const paidOn = String(formData.get("paid_on") ?? "");
  await invoiceRpc(id, "confirm_invoice_payment", { p_method: PAY_METHODS.includes(method) ? method : null, p_paid_on: isoDay.test(paidOn) ? paidOn : null });
}

export async function rejectInvoicePayment(id: string) {
  await invoiceRpc(id, "reject_invoice_payment");
}

export async function voidInvoice(id: string) {
  await invoiceRpc(id, "void_invoice");
}

/** Where the person would like to be paid; the Piron team checks the name against the ID (migration 0040). No money is handled. */
export async function savePayoutAccount(formData: FormData) {
  await requireFeature("payments");
  const back = "/app/profile/payout";
  await requireUser(back);
  const method = String(formData.get("method") ?? "");
  const name = String(formData.get("account_name") ?? "").trim().slice(0, 100);
  const number = String(formData.get("account_number") ?? "").trim().slice(0, 40);
  if (!["aba", "wing", "bank"].includes(method) || name.length < 2 || number.length < 3) redirect(`${back}?error=1`);
  const { error } = await (await createClient()).rpc("set_payout_account", { p_method: method, p_name: name, p_number: number });
  revalidatePath(back);
  redirect(error ? `${back}?error=1` : `${back}?saved=1`);
}
