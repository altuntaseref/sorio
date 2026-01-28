import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production için standalone output kullan (daha küçük Docker image)
  output: 'standalone',
  // Admin paneli /admin path'inde çalışacak
  basePath: '/admin',
};

export default nextConfig;
