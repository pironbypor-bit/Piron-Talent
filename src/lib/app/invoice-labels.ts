import type { InvoiceStatus, PayMethod } from "@/lib/app/types";

export const STATUS_LABEL: Record<InvoiceStatus, string> = { issued: "Waiting for payment", paid_claimed: "Marked as paid", received: "Payment received", void: "Cancelled" };
export const STATUS_TONE: Record<InvoiceStatus, "neutral" | "amber" | "green" | "red"> = { issued: "amber", paid_claimed: "amber", received: "green", void: "neutral" };
export const METHOD_LABEL: Record<PayMethod, string> = { cash: "Cash", bank: "Bank transfer", aba: "ABA", wing: "Wing", other: "Other" };
export const METHODS: PayMethod[] = ["cash", "bank", "aba", "wing", "other"];
export const money = (n: number, c: string) => `${c === "USD" ? "$" : `${c} `}${n.toFixed(2)}`;
