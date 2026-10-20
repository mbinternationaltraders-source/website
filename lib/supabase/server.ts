import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./public";

// Owner-session client: RLS sees the signed-in user and their MFA level.
export async function sessionClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list)
            store.set(name, value, options);
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
