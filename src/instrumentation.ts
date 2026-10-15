import type { Instrumentation } from "next";

// Next.js calls this for every error thrown while rendering a page, running a server action or a route handler.
// The message goes to the owner's error list in Piron Work Space.
//
// On Cloudflare the worker can stop as soon as the response is sent, which would cancel a report that is still
// in flight (found 2026-10-15: the test error never arrived). waitUntil keeps the worker alive until it is saved.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { reportError } = await import("@/lib/app/report-error");
  const message = err instanceof Error ? err.message : String(err);
  const source = context.routeType === "action" ? "action" : context.routeType === "route" ? "route" : "page";
  const task = reportError(source, message || "Unknown error", request.path);
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    getCloudflareContext().ctx.waitUntil(task);
  } catch {
    // Not running on Cloudflare (local development): the plain await below is enough.
  }
  await task;
};
