import type { NextConfig } from "next";
import { cardQueries } from "./lib/cards/query";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // The optimiser only resizes our own card images, and only with the exact
    // queries cardUrl builds, so it can't be pointed at anything else or made
    // to burn the quota with endless query variations.
    localPatterns: [
      { pathname: "/cards/sample/5/**", search: "?format=x&theme=dark" },
      ...cardQueries().map((search) => ({ pathname: "/cards/**", search })),
    ],
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
