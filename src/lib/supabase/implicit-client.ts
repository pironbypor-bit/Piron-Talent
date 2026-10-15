import { createClient } from "@supabase/supabase-js";

// A browser client for email links only (password reset).
//
// Why this is not createBrowserClient from @supabase/ssr: that helper forces flowType "pkce" whatever you pass,
// and a pkce client refuses an implicit link ("Not a valid PKCE flow url"). A pkce reset email also carries a
// one-time code that only works in the same browser that asked for it, so a link opened from the mail app or on
// another phone failed with "link expired". Found 2026-10-15.
//
// The plain supabase-js client with flowType "implicit" puts the session in the link itself (#access_token=...),
// so the email can be opened anywhere. The session is kept in memory only; the reset page hands it to the main
// client with setSession once the password is saved.
export function createImplicitClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: false, autoRefreshToken: false },
  });
}
