import type { NextConfig } from "next";

const API_URL = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["api", "@app/shared"],
  // The browser preview tunnel serves the app via 127.0.0.1:<port>
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  // Proxy API calls server-side: the browser only talks to its own origin,
  // so no CORS and no cross-origin/private-network issues in any preview setup.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
