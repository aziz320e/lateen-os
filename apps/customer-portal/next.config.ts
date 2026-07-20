import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@lateen-os/business-dna'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;
