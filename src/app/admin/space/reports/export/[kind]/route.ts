import { EXPORT_KINDS, getExportRows, type ExportKind } from "@/lib/app/space";

// CSV downloads for the owner: people, jobs, invoices. No email, phone or ID number is in any of them.
function cell(v: string | number | boolean | null): string {
  let s = v === null || v === undefined ? "" : typeof v === "boolean" ? (v ? "yes" : "no") : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula guard
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!(EXPORT_KINDS as readonly string[]).includes(kind)) return new Response("Not found", { status: 404 });
  const rows = await getExportRows(kind as ExportKind);
  if (!rows) return new Response("Not allowed", { status: 403 });
  const columns = Object.keys(rows[0] ?? {});
  const lines = [columns.map(cell).join(",")].concat(rows.map((r) => columns.map((c) => cell(r[c] ?? null)).join(",")));
  return new Response("\uFEFF" + lines.join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="piron-work-${kind}.csv"`,
      "cache-control": "no-store",
    },
  });
}
