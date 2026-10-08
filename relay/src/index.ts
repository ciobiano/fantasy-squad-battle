// Cloudflare Worker: a locked-down relay to the FPL API. The Next app uses it
// only when FPL's CDN blocks the Vercel server it's running on (see CLAUDE.md).

import { isAllowedFplRequest, keysMatch } from "./allow";

interface Env {
  readonly RELAY_SECRET: string;
}

const FPL_ORIGIN = "https://fantasy.premierleague.com";

const BROWSER_HEADERS: Readonly<Record<string, string>> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-GB,en;q=0.9",
  Referer: "https://fantasy.premierleague.com/",
};

const reply = (status: number, message: string) => new Response(message, { status });

const relay = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") return reply(405, "Method not allowed");
    // 401, not 403, so the app never mistakes a bad key for an FPL block.
    if (!keysMatch(request.headers.get("x-relay-key"), env.RELAY_SECRET)) {
      return reply(401, "Unauthorized");
    }

    const url = new URL(request.url);
    if (!isAllowedFplRequest(url.pathname, url.searchParams)) return reply(404, "Not found");

    const upstream = await fetch(`${FPL_ORIGIN}${url.pathname}${url.search}`, {
      headers: BROWSER_HEADERS,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  },
};

export default relay;
