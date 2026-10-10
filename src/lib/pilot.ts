import type { T } from "@/lib/i18n/core";

// Rows of the concierge pilot tables (migration 0003), as the pages read them.
export type RequestStatus = "new" | "contacted" | "matched" | "completed" | "closed";
export type ApplicantStatus = "new" | "contacted" | "approved" | "rejected";
export type JobStatus = "matched" | "in_progress" | "completed" | "cancelled";

export type ProjectRequest = {
  id: string;
  contact_name: string;
  contact: string;
  business_name: string | null;
  category_id: number | null;
  details: string;
  budget_min: number | null;
  budget_max: number | null;
  needed_by: string | null;
  locale: string;
  status: RequestStatus;
  admin_note: string | null;
  created_at: string;
};

export type ProviderApplication = {
  id: string;
  full_name: string;
  contact: string;
  city: string;
  category_id: number | null;
  skills: string;
  experience_years: number | null;
  portfolio_url: string | null;
  status: ApplicantStatus;
  admin_note: string | null;
  created_at: string;
};

export type PilotJob = {
  id: string;
  request_id: string;
  application_id: string;
  status: JobStatus;
  agreed_price: number | null;
  note: string | null;
  completed_at: string | null;
  created_at: string;
};

export const REQUEST_STATUSES: RequestStatus[] = ["new", "contacted", "matched", "completed", "closed"];
export const APPLICANT_STATUSES: ApplicantStatus[] = ["new", "contacted", "approved", "rejected"];
export const JOB_STATUSES: JobStatus[] = ["matched", "in_progress", "completed", "cancelled"];

const STATUS_TEXT: Record<string, string> = {
  new: "New@@status",
  contacted: "Contacted",
  matched: "Matched",
  completed: "Completed",
  closed: "Closed",
  approved: "Approved",
  rejected: "Rejected",
  in_progress: "In progress",
  cancelled: "Cancelled",
};

export const statusLabel = (t: T, status: string) => t(STATUS_TEXT[status] ?? status);

export const statusTone = (status: string): "neutral" | "amber" | "green" | "red" =>
  status === "new" ? "amber" : status === "completed" || status === "approved" ? "green" : status === "rejected" || status === "cancelled" ? "red" : "neutral";

export { formatDate } from "@/lib/dates";

export const formatBudget = (min: number | null, max: number | null) =>
  min === null && max === null ? null : min !== null && max !== null ? `$${min} - $${max}` : min !== null ? `$${min}+` : `$${max}`;
