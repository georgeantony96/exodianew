import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['sqlite3', 'better-sqlite3'],
  
  // Performance optimizations for development
  turbopack: {
    resolveAlias: {
      // Faster module resolution
      '@': './src',
    },
  },
  
  // Optimize for faster builds
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Development optimizations
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after change
        ignored: ['**/node_modules', '**/.next'],
      };
    }
    
    return config;
  },
  
  // Optimize images and static assets
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
