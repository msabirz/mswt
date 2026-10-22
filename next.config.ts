import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Baseline security headers. CSP is report-only; it is enforced and tightened in Step 10.
// Cashfree: the checkout SDK (sdk.cashfree.com) and its payment pages/APIs (*.cashfree.com).
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://sdk.cashfree.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com https://*.cashfree.com",
  "frame-src https://challenges.cloudflare.com https://*.cashfree.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.cashfree.com",
  "object-src 'none'",
].join("; ");

// Sent with every response.
const baseHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];
// Only meaningful on documents. Kept off hashed JS/CSS and font files, where they are dead weight
// on every request (Lighthouse counts header bytes in the script budget).
const documentHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // 404 for URLs that match no route, rendered as full server HTML (src/app/global-not-found.tsx).
  experimental: { globalNotFound: true },
  // pdfkit reads font files at runtime; keep it out of the bundle.
  serverExternalPackages: ["pdfkit"],
  // Files read with fs at runtime by the receipt routes (PDF fonts and the logo).
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/assets/receipt/**", "./public/brand/mswt-logo-horizontal.svg"],
  },
  async redirects() {
    // x-default is /en; the root never serves content of its own.
    return [{ source: "/", destination: "/en", permanent: true }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: baseHeaders },
      { source: "/((?!_next/static/|fonts/).*)", headers: documentHeaders },
      // Self-hosted font files never change in place (rename them to update).
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      { source: "/admin/:path*", headers: noindex },
      { source: "/admin", headers: noindex },
      { source: "/api/:path*", headers: [...noindex, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default withNextIntl(nextConfig);
