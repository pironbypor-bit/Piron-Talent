import type { Metadata } from "next";
import { ProfileSwitcherB } from "./view";

export const metadata: Metadata = { title: "Profile demo B" };

/** Demo B: a switcher at the top (me, my service, each company); the page below changes with it. */
export default function ProfileDemoB() {
  return (
    <main className="px-4 py-4">
      <ProfileSwitcherB />
    </main>
  );
}
