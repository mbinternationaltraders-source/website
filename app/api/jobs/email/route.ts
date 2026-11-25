import { authorizedCron } from "@/lib/server/cron";
import { noStore } from "@/lib/server/request";
import { emailConfigured, processOutbox } from "@/lib/server/email-worker";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!authorizedCron(request)) return noStore({ error: "Unauthorized" }, 401);
  if (!emailConfigured()) return noStore({ error: "Email service not configured" }, 503);
  const { ok, ...result } = await processOutbox(45_000);
  return ok ? noStore(result) : noStore({ error: "Queue unavailable", ...result }, 503);
}
