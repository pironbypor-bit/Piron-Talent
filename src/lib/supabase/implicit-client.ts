import { createBrowserClient } from "@supabase/ssr";

// A browser client for email links only (password reset). The default client uses the PKCE flow, whose
// one-time code works only in the browser that asked for the email. The implicit flow puts the session in
// the link itself, so the person can open the email anywhere. Not a singleton: it must not replace the main client.
export function createImplicitClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    isSingleton: false,
    auth: { flowType: "implicit", detectSessionInUrl: true },
  });
}
