import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent MIME sniffing from treating non-script responses as executable.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Keep cross-origin navigations from receiving full dashboard URLs.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Prevent the operator console from being embedded in hostile frames.
          { key: "X-Frame-Options", value: "DENY" },
          // Disable browser capabilities that this dashboard does not request.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
