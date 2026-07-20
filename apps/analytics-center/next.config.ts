import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: { optimizePackageImports: ['lucide-react', 'recharts', 'echarts'] },
};

export default nextConfig;
