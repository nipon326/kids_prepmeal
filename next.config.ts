import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Recipe photos are shrunk in the browser first, but base64 still needs headroom over the 1MB default.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
