import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  // Avoid picking a parent-folder lockfile (e.g. C:\Users\naira\package-lock.json)
  // as the workspace root when tracing output files.
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Reduce Windows worker crashes during "Collecting build traces"
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
  },
};

export default nextConfig;
