import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // A gameweek that is live or provisional: FPL data shifts until it's final.
    provisional: {
      stale: 60,
      revalidate: 300,
      expire: 3600,
    },
  },
};

export default nextConfig;
