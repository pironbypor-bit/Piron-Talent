import type { Metadata } from "next";
import { TeamDemo } from "./view";

export const metadata: Metadata = { title: "Team demo" };

/** Demo: the company team with schedule, tasks, pay and the public "works at" line. Sample data, nothing is saved. */
export default function TeamDemoPage() {
  return (
    <main className="px-4 py-4">
      <TeamDemo />
    </main>
  );
}
