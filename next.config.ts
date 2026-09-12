import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.117"],
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db", "./prisma/seeded.db"],
  },
};

export default nextConfig;
