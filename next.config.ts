import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.logo.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3-symbol-logo.tradingview.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
