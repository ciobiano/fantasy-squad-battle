import { connection } from "next/server";
import { fplId } from "@/lib/ids";
import { getPlanner } from "@/lib/planner";
import { hidden, inspectionAllowed } from "@/app/api/inspection";

// Inspection endpoint for the planner and team rating: the bundle the planner
// screen will read. ?team= imports that squad with its rating and transfer
// ideas; without it, an empty draft. ?weeks= (1–10, default 6).
// Previews only: production answers 404 (app/api/inspection.ts).

const WEEKS = /^([1-9]|10)$/;

const error = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  if (!inspectionAllowed()) return hidden();
  await connection();
  const query = new URL(request.url).searchParams;
  const [teamParam, weeksParam] = [query.get("team"), query.get("weeks")];
  const teamId = teamParam === null ? null : fplId(teamParam);
  if (teamParam !== null && teamId === null) return error(400, "invalid-team-id");
  if (weeksParam !== null && !WEEKS.test(weeksParam)) return error(400, "invalid-weeks");

  const started = performance.now();
  try {
    const outcome = await getPlanner(teamId, weeksParam === null ? undefined : Number(weeksParam));
    if (outcome.kind !== "ready") return error(404, outcome.kind);
    const ms = Math.round(performance.now() - started);
    return Response.json({ ms, data: outcome.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (failure) {
    console.error("[planner] load failed", failure);
    return error(502, "fpl-unavailable");
  }
}
