import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPush, type PushSubscriptionKeys } from "@/lib/webpush";

// Called by the database (migration 0018) right after a notification row is written, with that person's push
// subscriptions in the body. Verifies the shared secret, encrypts and sends one push per device, and removes
// subscriptions the push service reports as gone. Secrets come from the Cloudflare dashboard, never from code.

export const runtime = "nodejs";

type Body = { title?: string; body?: string | null; url?: string; subs?: PushSubscriptionKeys[] };

export async function POST(req: Request) {
  const secret = process.env.PUSH_HOOK_SECRET;
  const privateJwkRaw = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!secret || !privateJwkRaw || !publicKey) return NextResponse.json({ error: "push not configured" }, { status: 503 });
  if (req.headers.get("x-push-secret") !== secret) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let data: Body;
  try {
    data = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const subs = (data.subs ?? []).filter((s) => s && typeof s.endpoint === "string" && s.endpoint.startsWith("https://") && s.p256dh && s.auth).slice(0, 20);
  if (subs.length === 0) return NextResponse.json({ sent: 0 });

  const vapid = { publicKey, privateJwk: JSON.parse(privateJwkRaw) as JsonWebKey, subject: "mailto:pironbypor@gmail.com" };
  const payload = { title: data.title || "Piron Work", body: data.body ?? "", url: data.url || "/app/notifications" };
  const results = await Promise.all(subs.map((s) => sendPush(s, payload, vapid).catch(() => 0)));

  // Dead subscriptions (404 or 410) are pruned through a function that checks the same secret.
  const dead = subs.filter((_, i) => results[i] === 404 || results[i] === 410).map((s) => s.endpoint);
  if (dead.length && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    await Promise.all(dead.map((endpoint) => supabase.rpc("prune_push_subscription", { p_endpoint: endpoint, p_secret: secret })));
  }
  return NextResponse.json({ sent: results.filter((r) => r >= 200 && r < 300).length, pruned: dead.length, statuses: results });
}
