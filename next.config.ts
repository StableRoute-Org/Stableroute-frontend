import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            // Prevent browsers from MIME-sniffing API and asset responses.
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            // Keep full URLs local while sending only origins cross-site.
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            // Block clickjacking by disallowing the dashboard in frames.
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            // The dashboard does not need device sensors or media capture.
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
