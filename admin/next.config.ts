import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production için standalone output kullan (daha küçük Docker image)
  output: 'standalone',
};

export default nextConfig;
