import type { Metadata } from "next";
import { HomePagesDemo } from "./view";

export const metadata: Metadata = { title: "Home in three pages demo" };

/** Demo of Home split into Posts, Professionals and My bookings. Sample data, nothing is saved. */
export default function HomePagesDemoPage() {
  return <HomePagesDemo />;
}
