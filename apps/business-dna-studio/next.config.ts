import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@lateen-os/business-dna', '@lateen-os/workflow-engine', '@lateen-os/ai-workforce'],
  experimental: { optimizePackageImports: ['lucide-react', 'recharts', '@xyflow/react'] },
};

export default nextConfig;
