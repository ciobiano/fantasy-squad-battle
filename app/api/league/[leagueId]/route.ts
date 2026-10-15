import { getLeagueGameweek, resolveGameweek } from "@/lib/fpl/league-gameweek";
import { parseLeagueInput } from "@/lib/fpl/start-input";
import { hidden, inspectionAllowed } from "@/app/api/inspection";

// Phase 1 inspection endpoint: returns the raw bundle lib/league will consume,
// with timings, so caching can be checked on a real deployment.
// Previews only: production answers 404 (app/api/inspection.ts).

const GAMEWEEK = /^([1-9]|[1-3]\d)$/;

const error = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, ctx: RouteContext<"/api/league/[leagueId]">) {
  if (!inspectionAllowed()) return hidden();
  const { leagueId } = await ctx.params;
  const gwParam = new URL(request.url).searchParams.get("gw");

  const league = parseLeagueInput(leagueId);
  if (!league.ok) return error(400, "invalid-league-id");
  if (gwParam !== null && !GAMEWEEK.test(gwParam)) return error(400, "invalid-gameweek");

  const started = performance.now();
  try {
    const gameweek = await resolveGameweek(gwParam === null ? undefined : Number(gwParam), Date.now());
    if (!gameweek.ok) return error(404, gameweek.reason);
    const result = await getLeagueGameweek(league.leagueId, gameweek.id, gameweek.status);
    if (!result.ok) return error(404, result.reason);
    const ms = Math.round(performance.now() - started);
    return Response.json({ ms, data: result.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (failure) {
    console.error("[league] load failed", failure);
    return error(502, "fpl-unavailable");
  }
}
