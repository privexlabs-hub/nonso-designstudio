import type { NextConfig } from 'next';

/* Frontend-only studio: everything runs in the browser and state lives in localStorage, so it ships as a static export. */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
