import { createClient } from "@/lib/supabase/server";

/** The signed-in person's admin row, or null. The proxy already requires a login for /admin. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("admins").select("user_id").maybeSingle();
  return { supabase, isAdmin: !!data };
}
