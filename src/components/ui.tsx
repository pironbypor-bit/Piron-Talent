import type { ComponentProps, ReactNode } from "react";

// Small shared pieces so every page looks the same: dark text, white space, amber only on the primary action.

export const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-ink placeholder:text-stone-400 " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 aria-[invalid=true]:border-red-500";

export function Field({
  label,
  hint,
  optional,
  error,
  children,
}: {
  label: string;
  hint?: string;
  optional?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2 text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-ink-muted">({optional})</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-sm text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" }) {
  const base = "inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition disabled:opacity-60";
  const look =
    variant === "primary"
      ? "bg-brand-500 text-ink hover:bg-brand-400"
      : "border border-stone-300 bg-white text-ink hover:bg-brand-50";
  return <button className={`${base} ${look} ${className}`} {...props} />;
}

export function Notice({ tone, children }: { tone: "success" | "error" | "info"; children: ReactNode }) {
  const look =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-900"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-brand-200 bg-brand-50 text-brand-900";
  return <div className={`rounded-xl border px-4 py-3 text-base ${look}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function PageTitle({ children, lead }: { children: ReactNode; lead?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{children}</h1>
      {lead && <p className="mt-3 text-lg text-ink-muted">{lead}</p>}
    </header>
  );
}

/** A status pill. Pass already-translated text. */
export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "amber" | "green" | "red" }) {
  const look = {
    neutral: "bg-stone-100 text-stone-700",
    amber: "bg-brand-100 text-brand-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
  }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${look}`}>{children}</span>;
}
