import type { Metadata } from "next";
import { CompanyDemo } from "./view";

export const metadata: Metadata = { title: "Company page demo" };

/** Demo: company Documents area with Private, Team and Public files, and the public company page. Sample data, nothing is saved. */
export default function CompanyDemoPage() {
  return (
    <main className="px-4 py-4">
      <CompanyDemo />
    </main>
  );
}
