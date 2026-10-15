import type { Metadata } from "next";
import { PaymentsDemo } from "./view";

export const metadata: Metadata = { title: "Payments demo" };

/** Demo: paying inside the app (held until the work is confirmed), getting paid out, and identity check level 3. Sample data, nothing is saved, no money moves. */
export default function PaymentsDemoPage() {
  return (
    <main className="px-4 py-4">
      <PaymentsDemo />
    </main>
  );
}
