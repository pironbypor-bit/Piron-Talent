import { redirect } from "next/navigation";

/** Renamed to Workspace on 2026-10-10. */
export default function CommunityRedirect() {
  redirect("/demo/workspace");
}
