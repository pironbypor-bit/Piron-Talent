import { NextResponse } from "next/server";
import { reportError } from "@/lib/app/report-error";

/** The browser error screens post here so errors that happen on the phone reach the owner's list. */
export async function POST(request: Request) {
  let message = "";
  let path = "";
  try {
    const body = (await request.json()) as { message?: unknown; path?: unknown };
    message = typeof body.message === "string" ? body.message : "";
    path = typeof body.path === "string" ? body.path : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (message) await reportError("browser", message, path);
  return NextResponse.json({ ok: true });
}
