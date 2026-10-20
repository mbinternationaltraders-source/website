import { PolicyPage } from "@/components/policy-page";
import { policies } from "@/lib/policies";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  policies.cookies.title,
  policies.cookies.intro,
  "/cookies",
);
export default function Page() {
  return <PolicyPage slug="cookies" />;
}
