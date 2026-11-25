import { ResetPasswordForm } from "@/components/admin/reset-form";
import { hasSupabase } from "@/lib/supabase/public";

export const metadata = { title: "Set a new password" };

export default function Reset() {
  return <ResetPasswordForm configured={hasSupabase} />;
}
