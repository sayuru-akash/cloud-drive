import type { NextConfig } from "next";

const baseSecurityHeaders = [
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const denyFramingHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];

const sameOriginPreviewHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self';",
  },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/api/public-share/:token/preview",
        headers: [...baseSecurityHeaders, ...sameOriginPreviewHeaders],
      },
      {
        source: "/:path*",
        headers: [...baseSecurityHeaders, ...denyFramingHeaders],
      },
    ];
  },
};

export default nextConfig;
