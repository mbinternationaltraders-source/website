import { PolicyPage } from "@/components/policy-page";
import { policies } from "@/lib/policies";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  policies.privacy.title,
  policies.privacy.intro,
  "/privacy",
);
export default function Page() {
  return <PolicyPage slug="privacy" />;
}
