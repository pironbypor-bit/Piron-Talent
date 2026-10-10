import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page reads live shop data, so there is no page cache to store (no R2 bucket needed).
export default defineCloudflareConfig({});
