import type { NextConfig } from "next";
import { cardQueries } from "./lib/cards/query";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // The optimiser only resizes our own in-app card images (previews, no
    // grain), and only with the exact queries cardUrl builds, so it can't be
    // pointed at anything else or made to burn the quota with endless queries.
    localPatterns: cardQueries().map((search) => ({ pathname: "/cards/**", search })),
    // Phones top out at 828px wide: plenty for a card a phone shows at ~360px,
    // and a third of the pixels of a 1080px copy to make and to send.
    deviceSizes: [640, 750, 828],
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
