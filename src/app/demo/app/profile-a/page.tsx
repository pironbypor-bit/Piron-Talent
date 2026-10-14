import type { Metadata } from "next";
import { ProfileHubA } from "./view";

export const metadata: Metadata = { title: "Profile demo A" };

/** Demo A: one profile front page with a card per hat; each card opens its own page. */
export default function ProfileDemoA() {
  return (
    <main className="px-4 py-4">
      <ProfileHubA />
    </main>
  );
}
