import { redirect } from "next/navigation";
// Old bookmark: the overview lives at /admin.
export default function Dashboard() {
  redirect("/admin");
}
