import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { hasSupabase } from "@/lib/supabase/public";
export const metadata = { title: "Owner sign-in" };
export default function Login() {
  return (
    <>
      <LoginForm configured={hasSupabase} />
      <p className="login-back"><Link href="/">← Back to website</Link></p>
    </>
  );
}
