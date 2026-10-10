"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

const postSchema = z.object({
  kind: z.enum(["need_help", "offer_skill", "share_knowledge"]),
  title: text(3, 120),
  body: text(10, 3000),
  category_id: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable()),
  place: optional(80),
  price_text: optional(40),
});

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const uid = await requireUser("/app/post/new");
  const values = formEntries(formData, ["kind", "title", "body", "category_id", "place", "price_text"]);
  const parsed = postSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values, message: "Please check the highlighted fields." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").insert({ ...parsed.data, author_id: uid, status: "published" }).select("id").single();
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
});

export async function createJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const uid = await requireUser("/app/jobs/new");
  const values = formEntries(formData, ["title", "description", "city", "job_type", "pay_amount", "pay_unit", "remote_available"]);
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
  city: optional(80),
  is_available: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  primary_category_id: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable()),
  price_from: optional(40),
  remote: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  skills: z.string().max(600, "Too long."),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const uid = await requireUser("/app/profile/edit");
  const values = formEntries(formData, ["display_name", "role_line", "bio", "city", "is_available", "primary_category_id", "price_from", "remote", "skills"]);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values, message: "Please check the highlighted fields." };
  const { skills, ...profile } = parsed.data;
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

export async function markNotificationsRead() {
  const uid = await requireUser("/app/profile");
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", uid).is("read_at", null);
  revalidatePath("/app/profile");
}
