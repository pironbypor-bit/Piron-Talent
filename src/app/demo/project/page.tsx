import { redirect } from "next/navigation";

/** Old link from the first demo version. */
export default function DemoProjectRedirect() {
  redirect("/demo/projects/cafe-photos");
}
