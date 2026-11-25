import type { NextConfig } from "next";
const production = process.env.NODE_ENV === "production";
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${production ? "" : "'unsafe-eval'"} https://challenges.cloudflare.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin} https://www.google-analytics.com https://www.googletagmanager.com`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin} https://challenges.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com ${production ? "" : "ws://127.0.0.1:* ws://localhost:*"}`,
  "frame-src https://challenges.cloudflare.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
].join("; ");
const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  // 6 MB: product photos (max 5 MB, checked again in the upload action) plus form fields.
  experimental: {
    agentUpgrade: "security",
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    root: __dirname,
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
  webpack(config) {
    // The installed Tailwind loader also implements Webpack's loader API.
    // Keep a build path for environments that restrict Turbopack worker sockets.
    function addTailwind(rules: unknown[]) {
      for (const entry of rules) {
        if (!entry || typeof entry !== "object") continue;
        const rule = entry as {
          oneOf?: unknown[];
          rules?: unknown[];
          use?: unknown[];
        };
        if (Array.isArray(rule.oneOf)) addTailwind(rule.oneOf);
        if (Array.isArray(rule.rules)) addTailwind(rule.rules);
        if (
          Array.isArray(rule.use) &&
          rule.use.some(
            (loader) =>
              typeof loader === "object" &&
              loader !== null &&
              "loader" in loader &&
              String(loader.loader).includes("postcss-loader"),
          )
        )
          rule.use.push({ loader: "@tailwindcss/turbopack" });
      }
    }
    addTailwind(config.module.rules);
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
          ...(production
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};
export default nextConfig;
