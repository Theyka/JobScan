import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jobsearch.az',
      },
      {
        protocol: 'https',
        hostname: 'jobs.glorri.com',
      },
      {
        protocol: 'https',
        hostname: 'glorri.s3.eu-central-1.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
