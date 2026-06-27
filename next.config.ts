import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The legacy Vercel serverless functions under /api are deployed separately;
  // keep them out of the Next.js build by scoping page extensions to app/.
};

export default nextConfig;
