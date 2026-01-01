import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the database file is included in the deployment
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // Copy the database to the public directory during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle better-sqlite3 native bindings
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
      });
    }
    return config;
  },
};

export default nextConfig;
