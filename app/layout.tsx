import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { RevealObserver } from "@/components/reveal-observer";
import { BasketProvider } from "@/lib/basket";
import { PreferencesProvider, Analytics } from "@/components/preferences";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "MB International Traders — Components for manufacturers",
    template: "%s | MB International Traders",
  },
  description:
    "Explore C3M motors, pumps, bearings and appliance components. Build your requirement list and request a business quotation from Gujranwala, Pakistan.",
  robots:
    process.env.NEXT_PUBLIC_LAUNCH_READY === "true"
      ? { index: true, follow: true }
      : { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#f5f5f5" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Reveal animations only hide content when JavaScript is running to show it again. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <BasketProvider>
          <PreferencesProvider>
            {children}
            <Suspense fallback={null}>
              <RevealObserver />
              <Analytics />
            </Suspense>
          </PreferencesProvider>
        </BasketProvider>
      </body>
    </html>
  );
}
