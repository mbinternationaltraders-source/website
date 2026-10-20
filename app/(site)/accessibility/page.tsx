import { PolicyPage } from "@/components/policy-page";
import { policies } from "@/lib/policies";
import { metadataFor } from "@/lib/seo";
export const metadata = metadataFor(
  policies.accessibility.title,
  policies.accessibility.intro,
  "/accessibility",
);
export default function Page() {
  return <PolicyPage slug="accessibility" />;
}
