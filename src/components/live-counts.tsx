"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Live unread counts for the bell and the Messages tab. The server renders the first numbers; after that the
// browser listens to its own notifications and to messages in its conversations (row level security applies to
// the stream) and re-counts on every change. The tab title carries the count too.

type Counts = { unread: number; unreadMessages: number };
const Ctx = createContext<Counts | null>(null);

export const useLiveCounts = () => useContext(Ctx);

export function LiveCountsProvider({ userId, unread, unreadMessages, children }: Counts & { userId: string | null; children: ReactNode }) {
  const [counts, setCounts] = useState<Counts>({ unread, unreadMessages });
  const [seen, setSeen] = useState<Counts>({ unread, unreadMessages });
  const pathname = usePathname();

  // Fresh server numbers after each navigation win over the last live count (state adjusted during render).
  if (seen.unread !== unread || seen.unreadMessages !== unreadMessages) {
    setSeen({ unread, unreadMessages });
    setCounts({ unread, unreadMessages });
  }

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let alive = true;
    const refresh = async () => {
      const [{ count }, { data }] = await Promise.all([
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
        supabase.rpc("unread_conversations"),
      ]);
      if (alive) setCounts({ unread: count ?? 0, unreadMessages: (data as number | null) ?? 0 });
    };
    const channel = supabase
      .channel(`live-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, refresh)
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // "(2) Piron Work" in the tab title; re-applied when Next replaces the title on navigation.
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\+?\) /, "");
      const next = counts.unread > 0 ? `(${counts.unread > 9 ? "9+" : counts.unread}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const title = document.querySelector("title");
    if (!title) return;
    const obs = new MutationObserver(apply);
    obs.observe(title, { childList: true, characterData: true, subtree: true });
    return () => obs.disconnect();
  }, [counts.unread, pathname]);

  return <Ctx.Provider value={counts}>{children}</Ctx.Provider>;
}
