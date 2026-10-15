import { getMoneyExport } from "@/lib/app/space";

// CSV of every revenue and cost entry that counts, month by month. Owner only: anyone else gets 403.
function cell(v: string | number | boolean | null): string {
  let s = v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula guard
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const rows = await getMoneyExport(12);
  if (!rows) return new Response("Not allowed", { status: 403 });
  const head = ["Month", "Kind", "Type", "Amount (USD)", "Monthly", "Note"];
  const lines = [head.join(",")].concat(
    rows.map((r) => [r.month.slice(0, 7), r.kind === "income" ? "Revenue" : "Cost", r.type, Number(r.amount).toFixed(2), r.repeats ? "yes" : "no", r.note].map(cell).join(",")),
  );
  return new Response("\uFEFF" + lines.join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="piron-work-money.csv"',
      "cache-control": "no-store",
    },
  });
}
