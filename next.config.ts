import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Restrict server-side file access to the project and home directories only
  serverExternalPackages: [],
};

export default nextConfig;
