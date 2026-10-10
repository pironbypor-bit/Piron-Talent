// Rows as the app pages read them (after migration 0004).

export type PostKind = "need_help" | "offer_skill" | "share_knowledge" | "hire_shift";

export type Author = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role_line: string | null;
  identity_checked: boolean;
};

export type PostRow = {
  id: string;
  kind: PostKind;
  title: string;
  body: string;
  place: string | null;
  price_text: string | null;
  category_id: number | null;
  created_at: string;
  author: Author;
  cheers: number;
  comments: number;
  cheered: boolean;
  kept: boolean;
};

export type CommentRow = { id: string; body: string; created_at: string; author: Author };

export type ProviderRow = Author & {
  city: string | null;
  bio: string | null;
  price_from: string | null;
  remote: boolean;
  completed_jobs: number;
  primary_category_id: number | null;
  skills: string[];
  saved: boolean;
};

export type JobRow = {
  id: string;
  title: string;
  description: string;
  city: string | null;
  remote_available: boolean;
  job_type: "part_time" | "short_term" | "freelance" | "project";
  pay_amount: number | null;
  pay_unit: "hour" | "day" | "shift" | "project";
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  poster: Author;
};

export type ConversationRow = {
  id: string;
  other: Author | null;
  last: { body: string; created_at: string; sender_id: string } | null;
};

export type MessageRow = { id: string; body: string; created_at: string; sender_id: string };

export type NotificationRow = { id: string; title: string; body: string | null; link_path: string | null; read_at: string | null; created_at: string };

export type MeRow = Author & {
  bio: string | null;
  city: string | null;
  is_available: boolean;
  price_from: string | null;
  remote: boolean;
  primary_category_id: number | null;
  completed_jobs: number;
  skills: string[];
};

/** English keys for t(); the UI shows the owner's names (Job offer, Skill offer, Share knowledge). */
export const KIND_LABEL: Record<PostKind, string> = {
  need_help: "Job offer",
  offer_skill: "Skill offer",
  share_knowledge: "Share knowledge",
  hire_shift: "Hire shift",
};
