import { trackServer } from "@/lib/analytics/capture";
import { parseClientEvent } from "@/lib/analytics/events";

// Where the browser reports shares and downloads (lib/analytics/client.ts).
// Only our own pages may post, only the two client events, with exactly their
// properties. PostHog gets them after the response.
// Rate limited by the Vercel Firewall rule "Rate limit analytics beacons" (POST,
// 300 a minute per IP; logging only until real traffic has been reviewed).

const MAX_BYTES = 1024;

const empty = (status: number) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });

/** Our own pages only: browsers mark same-origin requests, and send an Origin that matches the host. */
function fromOurPages(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (origin === null) return site === "same-origin";
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!fromOurPages(request)) return empty(403);
  const text = await request.text();
  if (text.length > MAX_BYTES) return empty(413);
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return empty(400);
  }
  const parsed = parseClientEvent(input);
  if (!parsed) return empty(400);
  trackServer(parsed.event, parsed.props, request.headers);
  return empty(204);
}
