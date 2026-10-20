import { Confirmation } from "@/components/confirmation";
export const metadata = {
  title: "Your request",
  robots: { index: false, follow: false },
};
export default function ThankYou() {
  return <Confirmation />;
}
