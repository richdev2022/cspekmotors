import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow larger multipart uploads via Server Actions (e.g. admin form submissions
  // that include file inputs). Vercel's serverless function body size limit
  // (4.5MB Hobby / 5MB Pro) still applies to API routes — for large videos,
  // the client uses Vercel Blob's direct upload which bypasses the Function.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
