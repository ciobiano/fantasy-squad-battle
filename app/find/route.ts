import type { NextRequest } from "next/server";
import { parseStartInput, type StartMode } from "@/lib/fpl/start-input";

// The Start form posts here (GET, so it works without JavaScript and the back
// button behaves). A team goes to its league picker, a league to the league;
// anything else goes back to Start with the reason and what was typed.
export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const mode: StartMode = query.get("mode") === "league" ? "league" : "team";
  const raw = (query.get("q") ?? "").slice(0, 300);
  const input = parseStartInput(raw, mode);

  const to = (path: string) => Response.redirect(new URL(path, request.url), 303);
  if (input.ok) return to(input.kind === "team" ? `/team/${input.teamId}` : `/league/${input.leagueId}`);

  const back = new URLSearchParams({ start: "1", mode, q: raw, error: input.error });
  return to(`/?${back}`);
}
