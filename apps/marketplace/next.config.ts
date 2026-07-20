import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@lateen-os/extension-system'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
