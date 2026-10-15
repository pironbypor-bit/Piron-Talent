import type { Metadata } from "next";
import { MoneyDemo } from "./view";

export const metadata: Metadata = { title: "Piron Work Space money demo" };

/** Demo of Piron Work Space step 6 (Money). Sample numbers, nothing is saved, reload resets it. */
export default function MoneyDemoPage() {
  return <MoneyDemo />;
}
