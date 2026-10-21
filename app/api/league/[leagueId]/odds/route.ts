import { connection } from "next/server";
import { fplId, gameweekNumber } from "@/lib/ids";
import { getLeagueOdds } from "@/lib/league/odds";
import { hidden, inspectionAllowed } from "@/app/api/inspection";

// Inspection endpoint for "Tipped to win": each manager's chance of winning
// the league, finishing top three and finishing last. ?gw= (default: the
// newest gameweek with unlocked cards). Previews only: production answers 404.

const error = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, ctx: RouteContext<"/api/league/[leagueId]/odds">) {
  if (!inspectionAllowed()) return hidden();
  await connection();
  const leagueId = fplId((await ctx.params).leagueId);
  if (leagueId === null) return error(400, "invalid-league-id");
  const gwParam = new URL(request.url).searchParams.get("gw");
  const gw = gwParam === null ? undefined : gameweekNumber(gwParam);
  if (gw === null) return error(400, "invalid-gameweek");

  const started = performance.now();
  try {
    const result = await getLeagueOdds(leagueId, { gw, now: Date.now() });
    if (!result.ok) return error(404, result.reason);
    const ms = Math.round(performance.now() - started);
    return Response.json({ ms, data: result.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (failure) {
    console.error("[odds] load failed", failure);
    return error(502, "fpl-unavailable");
  }
}
