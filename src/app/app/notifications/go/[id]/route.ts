import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Opening a notification: mark it read, then go where it points. Links to this route are never prefetched. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const back = new URL("/app/notifications", req.url);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(back, 303);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=%2Fapp%2Fnotifications", req.url), 303);
  const { data } = await supabase.from("notifications").select("link_path,read_at").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!data) return NextResponse.redirect(back, 303);
  if (!data.read_at) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  const dest = data.link_path && data.link_path.startsWith("/") && !data.link_path.startsWith("//") ? data.link_path : "/app/notifications";
  return NextResponse.redirect(new URL(dest, req.url), 303);
}
