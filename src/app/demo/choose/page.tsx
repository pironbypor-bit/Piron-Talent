import type { Metadata } from "next";
import { ChooseScreen } from "@/components/choose-screen";

export const metadata: Metadata = { title: "Login chooser demo" };

/** Preview of what the owner sees after logging in. The real page is /choose. */
export default function ChooseDemo() {
  return <ChooseScreen name="Piron" appHref="/demo/app" spaceHref="/demo/space" />;
}
