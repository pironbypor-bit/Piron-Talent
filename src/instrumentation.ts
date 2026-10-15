import type { Instrumentation } from "next";

// Next.js calls this for every error thrown while rendering a page, running a server action or a route handler.
// The message goes to the owner's error list in Piron Work Space.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { reportError } = await import("@/lib/app/report-error");
  const message = err instanceof Error ? err.message : String(err);
  const source = context.routeType === "action" ? "action" : context.routeType === "route" ? "route" : "page";
  await reportError(source, message || "Unknown error", request.path);
};
