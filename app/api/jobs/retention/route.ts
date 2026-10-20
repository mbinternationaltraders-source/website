import { authorizedCron } from "@/lib/server/cron";
import { serviceClient } from "@/lib/supabase/service";
import { noStore } from "@/lib/server/request";
export async function GET(request: Request) {
  if (!authorizedCron(request)) return noStore({ error: "Unauthorized" }, 401);
  if (process.env.RETENTION_ENABLED !== "true")
    return noStore({ status: "disabled" });
  const { error } = await serviceClient().rpc("purge_expired");
  return error
    ? noStore({ error: "Retention job failed" }, 503)
    : noStore({ status: "complete" });
}
