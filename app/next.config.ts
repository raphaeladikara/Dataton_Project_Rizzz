import type { NextConfig } from "next";

import { currentBuildMode, securityHeaders } from "./src/security/responseHeaders";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return securityHeaders(currentBuildMode(process.env.NODE_ENV));
  },
};

export default nextConfig;
