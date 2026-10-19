import { connection } from "next/server";
import { fplId } from "@/lib/ids";
import { getLeaguePaper } from "@/lib/planner/league";
import { hidden, inspectionAllowed } from "@/app/api/inspection";

// Inspection endpoint for "on paper": every squad in a league rated over the
// coming gameweeks and ranked. ?weeks= (1–10, default 6).
// Previews only: production answers 404 (app/api/inspection.ts).

const WEEKS = /^([1-9]|10)$/;

const error = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, ctx: RouteContext<"/api/planner/league/[leagueId]">) {
  if (!inspectionAllowed()) return hidden();
  await connection();
  const leagueId = fplId((await ctx.params).leagueId);
  if (leagueId === null) return error(400, "invalid-league-id");
  const weeksParam = new URL(request.url).searchParams.get("weeks");
  if (weeksParam !== null && !WEEKS.test(weeksParam)) return error(400, "invalid-weeks");

  const started = performance.now();
  try {
    const table = await getLeaguePaper(leagueId, weeksParam === null ? undefined : Number(weeksParam));
    if (table.kind !== "ready") return error(404, table.kind);
    const ms = Math.round(performance.now() - started);
    return Response.json({ ms, data: table }, { headers: { "Cache-Control": "no-store" } });
  } catch (failure) {
    console.error("[planner] league load failed", failure);
    return error(502, "fpl-unavailable");
  }
}
