import { redirect } from "next/navigation";

/** Proposal B became the homepage on 2026-10-10. */
export default function HomeBRedirect() {
  redirect("/");
}
