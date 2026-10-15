import { parseStartInput } from "@/lib/fpl/start-input";
import { getMyTeam } from "@/lib/league/my-team";
import { hidden, inspectionAllowed } from "@/app/api/inspection";

// Inspection endpoint for "Find my leagues": a team ID becomes the league picker list.
// Previews only: production answers 404 (app/api/inspection.ts).

const error = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_request: Request, ctx: RouteContext<"/api/team/[teamId]">) {
  if (!inspectionAllowed()) return hidden();
  const { teamId } = await ctx.params;
  const input = parseStartInput(teamId, "team");
  if (!input.ok || input.kind !== "team") return error(400, "invalid-team-id");

  const started = performance.now();
  try {
    const result = await getMyTeam(input.teamId);
    if (!result.ok) return error(404, result.reason);
    const ms = Math.round(performance.now() - started);
    return Response.json({ ms, data: result.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (failure) {
    console.error("[team] load failed", failure);
    return error(502, "fpl-unavailable");
  }
}
