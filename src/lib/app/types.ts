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
  deadline: string | null;
  budget_min: number | null;
  budget_max: number | null;
  remote: boolean;
  deliverables: string[];
  invited_provider_id: string | null;
  opens_at: string | null;
  invited: Author | null;
  author: Author;
  cheers: number;
  comments: number;
  cheered: boolean;
  kept: boolean;
};

export type CommentRow = { id: string; body: string; created_at: string; author: Author };

export type Signals = { available_until: string | null; reply_minutes: number | null; replies: number };
export type ProviderCard = { title: string | null; services: string | null; price_from: string | null; city: string | null; about: string | null };

export type ProviderRow = Author & Signals & {
  card?: ProviderCard | null;
  city: string | null;
  district: string | null;
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
  kind: "direct" | "group";
  title: string | null;
  memberCount: number;
  other: Author | null;
  last: { body: string; created_at: string; sender_id: string } | null;
  lastSenderName: string | null;
  unread: boolean;
};

export type GroupMember = Author & { role: "owner" | "member" };
export type ConversationDetail = {
  kind: "direct" | "group";
  title: string | null;
  postId: string | null;
  other: Author | null;
  members: GroupMember[];
  iAmOwner: boolean;
  blocked: boolean;
  messages: MessageRow[];
};
export type BlockedPerson = { user: Author; created_at: string };

export type MessageRow = { id: string; body: string; created_at: string; sender_id: string; attachment_path: string | null; attachment_type: string | null };

export type NotificationRow = { id: string; title: string; body: string | null; link_path: string | null; read_at: string | null; created_at: string };

export type MeRow = Author & {
  bio: string | null;
  city: string | null;
  district: string | null;
  is_available: boolean;
  available_until: string | null;
  record_public: boolean;
  price_from: string | null;
  remote: boolean;
  primary_category_id: number | null;
  completed_jobs: number;
  paused_at: string | null;
  skills: string[];
};

/** English keys for t(); the UI shows the owner's names (Job offer, Skill offer, Share knowledge). */
export const KIND_LABEL: Record<PostKind, string> = {
  need_help: "Job offer",
  offer_skill: "Skill offer",
  share_knowledge: "Share knowledge",
  hire_shift: "Hire shift",
};

// Phase 2 core loop
export type QuoteStatus = "pending" | "accepted" | "declined" | "withdrawn";
export type QuoteStats = { rating: number | null; reviews: number; completed_jobs: number };
export type QuoteRow = { id: string; post_id: string; provider_id: string; price: number; days: number | null; note: string | null; status: QuoteStatus; created_at: string; provider: Author; stats: QuoteStats };
export type ProjectJobStatus = "accepted" | "delivered" | "confirmed" | "cancelled";
export type ProjectJobRow = {
  id: string;
  post_id: string;
  quote_id: string;
  customer_id: string;
  provider_id: string;
  agreed_price: number;
  status: ProjectJobStatus;
  delivered_at: string | null;
  confirmed_at: string | null;
  note: string | null;
  created_at: string;
};
export type ProjectScope = { deliverables: string[]; deadline: string | null; remote: boolean; budget_min: number | null; budget_max: number | null };

export type DisputeStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type DisputeRow = { id: string; opened_by: string; status: DisputeStatus; reason: string; resolution: string | null; created_at: string };

export type BusinessRole = "owner" | "manager" | "member";
export type BusinessRow = { id: string; name: string; description: string | null; city: string | null; created_at: string; conversation_id: string | null; role: BusinessRole; jobs: number; projects: number };
export type TeamMember = { user_id: string; display_name: string; avatar_url: string | null; role: BusinessRole; job_title: string | null };
export type RateUnit = "hour" | "day" | "month";
export type MemberTerms = { user_id: string; job_title: string | null; duties: string | null; rate: number | null; rate_unit: RateUnit | null; starts_on: string | null };
export type PayRecordRow = { id: string; user_id: string; period_from: string; period_to: string; quantity: number; unit: RateUnit; rate: number; amount: number; status: "owed" | "paid"; paid_on: string | null; note: string | null };
export type BusinessInvitationRow = { id: string; business_id: string; business_name: string; role: "manager" | "member"; inviter: string; created_at: string };
export type CompanyDoc = { id: string; business_id: string; name: string; mime: string; bytes: number; level: "private" | "team" | "public"; created_at: string; updated_at: string };
export type CompanyPublic = {
  id: string; name: string; kind: string | null; city: string | null; about: string | null; is_public: boolean; owner_checked: boolean;
  posts: { id: string; title: string; kind: string; city: string | null; budget_min: number | null; budget_max: number | null; created_at: string }[];
  jobs: { id: string; title: string; city: string | null; pay_amount: number | null; pay_unit: string; created_at: string }[];
  activities: { id: string; title: string; place: string | null; city: string | null; starts_at: string; capacity: number; joined: number }[];
  documents: { id: string; name: string; mime: string; bytes: number }[];
};
export type WorksAt = { id: string; name: string; job_title: string | null; role: BusinessRole };
export type BusinessDetail = Omit<BusinessRow, "jobs" | "projects"> & {
  show_on_profile: boolean;
  page_public: boolean;
  about: string | null;
  team: TeamMember[];
  jobs: { id: string; title: string; job_type: string; status: string; created_at: string; applicants: number }[];
  posts: { id: string; title: string; status: string; created_at: string }[];
};

export type WorkRecordRow = { job_id: string; title: string; completed_at: string; role: "provider" | "customer"; other_name: string | null; other_id: string | null };

export type ContactState = "anon" | "self" | "conversation" | "open" | "pending" | "incoming" | "declined" | "can_request";
export type MessageRequestRow = { id: string; body: string; created_at: string; other: Author };

export type InvitationRow = { provider: Author; quoted: boolean; created_at: string };
export type InviteCandidate = Author & { source: "worked" | "kept" | "category" };
export type InviteState = { invited: InvitationRow[]; candidates: InviteCandidate[]; invitedMe: boolean };

export type ActivityMine = "joined" | "waitlist" | "confirmed" | "absent" | null;
export type ActivityRow = {
  id: string;
  organiser: Author;
  title: string;
  description: string;
  place: string | null;
  city: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  bring: string | null;
  status: "open" | "cancelled";
  conversation_id: string | null;
  joined: number;
  waitlist: number;
  mine: ActivityMine;
};
export type ActivityVolunteer = { user: Author; status: "joined" | "waitlist" | "confirmed" | "absent"; hours: number | null };

export type JobAlertRow = { id: string; category_id: number | null; city: string | null };

export type ShiftRow = { id: string; user_id: string; person: string; starts_at: string; ends_at: string; note: string | null; clock_in_at: string | null; clock_out_at: string | null; absent: boolean };
export type TaskStatus = "todo" | "doing" | "done";
export type TaskRow = { id: string; title: string; detail: string | null; assignee_id: string | null; assignee: string | null; status: TaskStatus; due_on: string | null; created_at: string };

export type InvoiceStatus = "issued" | "paid_claimed" | "received" | "void";
export type PayMethod = "cash" | "bank" | "aba" | "wing" | "other";
export type InvoiceRow = {
  id: string; number: string; job_id: string; issuer_id: string; customer_id: string; issuer_name: string; customer_name: string;
  title: string; amount: number; currency: string; note: string | null; due_on: string | null; status: InvoiceStatus;
  paid_method: PayMethod | null; paid_on: string | null; paid_ref: string | null; issued_at: string; claimed_at: string | null; received_at: string | null; void_at: string | null;
};

export type PayoutMethod = "aba" | "wing" | "bank";
export type PayoutAccount = { method: PayoutMethod; account_name: string; account_number: string; status: "pending" | "approved" | "rejected"; note: string | null; updated_at: string };

// Bookings (migration 0055) ---------------------------------------------------------------------------------

export type BookingStatus = "requested" | "countered" | "accepted" | "declined" | "cancelled" | "expired";
export type BookingRow = {
  id: string;
  status: BookingStatus;
  details: string;
  place: string | null;
  requested_start: string | null;
  budget: number | null;
  counter_price: number | null;
  counter_start: string | null;
  agreed_price: number | null;
  agreed_start: string | null;
  decline_reason: string | null;
  post_id: string | null;
  expires_at: string;
  created_at: string;
  mine: "customer" | "provider";
  other: { id: string; display_name: string; avatar_url: string | null };
};

// The Bookings page lists several kinds of things in one list ---------------------------------------------

export type MyApplication = { id: string; status: "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn"; created_at: string; job: { id: string; title: string; city: string | null } };
export type MyQuote = { id: string; status: string; price: number; created_at: string; post: { id: string; title: string } };
