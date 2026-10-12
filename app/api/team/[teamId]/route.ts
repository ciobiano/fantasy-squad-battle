import { parseStartInput } from "@/lib/fpl/start-input";
import { getMyTeam } from "@/lib/league/my-team";

// Inspection endpoint for "Find my leagues": a team ID becomes the league picker list.
// TODO(before launch): remove, or rate-limit with Vercel Firewall (like /api/health).

const error = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_request: Request, ctx: RouteContext<"/api/team/[teamId]">) {
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
