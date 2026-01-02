import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure better-sqlite3 is treated as external package
  serverExternalPackages: ['better-sqlite3'],
  // Silence workspace root warning
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
