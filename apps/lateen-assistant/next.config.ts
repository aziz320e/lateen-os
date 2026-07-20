import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@lateen-os/business-dna', '@lateen-os/launch-product-mission'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@xyflow/react', 'lucide-react'],
  },
};

export default nextConfig;
