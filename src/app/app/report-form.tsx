import { Flag } from "lucide-react";
import { Button, inputClass } from "@/components/ui";
import { fileReport, type ReportType } from "@/lib/app/actions";
import type { T } from "@/lib/i18n/core";

/** Small "Report" disclosure at the bottom of a post, profile or job. Posts to file_report; the admin queue picks it up. */
export function ReportForm({ type, id, path, reported, t }: { type: ReportType; id: string; path: string; reported?: boolean; t: T }) {
  if (reported) return <p className="mt-6 text-sm text-ink-muted">{t("Thank you. We will look at this report.")}</p>;
  return (
    <details className="mt-6 text-sm">
      <summary className="inline-flex cursor-pointer items-center gap-1 text-ink-muted hover:text-ink">
        <Flag className="size-3.5" aria-hidden="true" /> {t("Report")}
      </summary>
      <form action={fileReport.bind(null, type, id, path)} className="mt-2 flex gap-2">
        <input name="reason" required minLength={3} maxLength={1000} placeholder={t("What is wrong?")} className={`${inputClass} py-1.5 text-sm`} />
        <Button type="submit" variant="secondary" className="shrink-0 px-3 py-1.5 text-sm">
          {t("Send report")}
        </Button>
      </form>
    </details>
  );
}
