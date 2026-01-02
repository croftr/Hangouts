import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure better-sqlite3 is treated as external package
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
