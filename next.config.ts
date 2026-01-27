import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    unoptimized: true,
  },
  experimental: { viewTransition: true },
};

export default nextConfig;
