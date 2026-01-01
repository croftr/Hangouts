import type { NextConfig } from "next";
import { copyFileSync } from 'fs';
import { join } from 'path';

const nextConfig: NextConfig = {
  // Ensure the database file is included in the deployment
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // Output as standalone for better compatibility with static files
  output: 'standalone',
  // Copy database file during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle better-sqlite3 native bindings
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
      });

      // Copy database file to output directory
      config.plugins.push({
        apply: (compiler: any) => {
          compiler.hooks.afterEmit.tap('CopyDatabasePlugin', () => {
            try {
              const dbSource = join(process.cwd(), 'messages.db');
              const dbDest = join(process.cwd(), '.next', 'standalone', 'messages.db');
              copyFileSync(dbSource, dbDest);
              console.log('Database copied to .next/standalone/');
            } catch (err) {
              console.log('Database copy skipped (will be handled by Vercel)');
            }
          });
        }
      });
    }
    return config;
  },
};

export default nextConfig;
