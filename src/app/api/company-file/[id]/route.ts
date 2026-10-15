import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Opens one company file. Row security on business_documents decides who may see the row, and the storage
 * policy decides who may sign the file, so a Private or Team file never leaves for a visitor.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: doc } = await supabase.from("business_documents").select("path").eq("id", id).maybeSingle();
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabase.storage.from("company-files").createSignedUrl((doc as { path: string }).path, 120);
  if (!data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
