import { parseLeagueInput, parseStartInput } from "@/lib/fpl/start-input";
import { getLeagueView } from "@/lib/league/league-view";
import { type Lang, roastView } from "@/lib/roasts";

// Inspection endpoint for Phase 2: the computed league view (awards, Market,
// Table, Team of the Week) for ?gw= (default: newest unlocked) and ?you=<team ID>,
// plus the roast lines and the Wrap's group lines in ?lang= (pcm, en or fr; default pcm).
// TODO(before launch): remove, or rate-limit with Vercel Firewall (like /api/health).

const GAMEWEEK = /^([1-9]|[1-3]\d)$/;
const LANGS: readonly Lang[] = ["pcm", "en", "fr"];
const isLang = (value: string): value is Lang => (LANGS as readonly string[]).includes(value);

const error = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, ctx: RouteContext<"/api/league/[leagueId]/view">) {
  const { leagueId } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const gwParam = params.get("gw");
  const youParam = params.get("you");
  const lang = params.get("lang") ?? "pcm";

  const league = parseLeagueInput(leagueId);
  if (!league.ok) return error(400, "invalid-league-id");
  if (gwParam !== null && !GAMEWEEK.test(gwParam)) return error(400, "invalid-gameweek");
  const you = youParam === null ? null : parseStartInput(youParam, "team");
  if (you && (!you.ok || you.kind !== "team")) return error(400, "invalid-team-id");
  if (!isLang(lang)) return error(400, "invalid-lang");

  const started = performance.now();
  try {
    const result = await getLeagueView(league.leagueId, {
      gw: gwParam === null ? undefined : Number(gwParam),
      now: Date.now(),
      youId: you?.ok && you.kind === "team" ? you.teamId : undefined,
    });
    if (!result.ok) return error(404, result.reason);
    const ms = Math.round(performance.now() - started);
    return Response.json({ ms, ...roastView(result.data, lang), view: result.data }, { headers: { "Cache-Control": "no-store" } });
  } catch (failure) {
    console.error("[league view] failed", failure);
    return error(502, "fpl-unavailable");
  }
}
