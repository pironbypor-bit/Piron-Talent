// The Worker Cloudflare runs: the Next.js app that OpenNext builds.
// `.open-next/worker.js` only exists after `opennextjs-cloudflare build`, so the import is unchecked before a build.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { default as handler } from "../.open-next/worker.js";

export default { fetch: handler.fetch };
