import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '37.252.17.34',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '212.193.24.67',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'chocoberry.tj',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'chocoberry.tj',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
