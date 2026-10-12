import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Only the two sample cards on the Start screen go through the image
    // optimiser, with exactly this query, so it can't be pointed at anything else.
    localPatterns: [{ pathname: "/cards/sample/5/**", search: "?format=x&theme=dark" }],
  },
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
