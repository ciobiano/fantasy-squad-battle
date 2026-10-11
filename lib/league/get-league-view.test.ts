import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bootstrap from "@/lib/fpl/__fixtures__/bootstrap.json";
import dreamTeam from "@/lib/fpl/__fixtures__/dream-team.json";
import fixtures from "@/lib/fpl/__fixtures__/fixtures.json";
import history from "@/lib/fpl/__fixtures__/history.json";
import live from "@/lib/fpl/__fixtures__/live.json";
import picks from "@/lib/fpl/__fixtures__/picks.json";
import standings from "@/lib/fpl/__fixtures__/standings.json";
import { AWARD_ORDER } from "./types";
import { getLeagueView } from "./league-view";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

// End to end on real (trimmed, anonymised) GW5 responses: every manager in the
// sample shares one history and one set of picks, so most awards are ties.

const CAPTURED_AT = Date.parse("2026-10-09T12:00:00Z");

function stubFpl(override?: (path: string) => number | undefined) {
  const routes: [RegExp, unknown][] = [
    [/^\/api\/bootstrap-static\/$/, bootstrap],
    [/^\/api\/fixtures\/$/, fixtures],
    [/^\/api\/leagues-classic\/\d+\/standings\/$/, standings],
    [/^\/api\/entry\/\d+\/history\/$/, history],
    [/^\/api\/entry\/\d+\/event\/\d+\/picks\/$/, picks],
    [/^\/api\/event\/\d+\/live\/$/, live],
    [/^\/api\/dream-team\/\d+\/$/, dreamTeam],
  ];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL | string) => {
      const path = new URL(String(input)).pathname;
      const status = override?.(path);
      const body = routes.find(([re]) => re.test(path))?.[1];
      const ok = status === undefined && body !== undefined;
      return new Response(JSON.stringify(ok ? body : { detail: "Not found." }), {
        status: ok ? 200 : (status ?? 404),
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

beforeEach(() => {
  vi.stubEnv("FPL_RELAY_URL", "");
  vi.stubEnv("FPL_RELAY_KEY", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getLeagueView", () => {
  it("builds the whole view for the newest unlocked gameweek", async () => {
    stubFpl();
    const result = await getLeagueView(314, { now: CAPTURED_AT, youId: standings.standings.results[0].entry });
    if (!result.ok) throw new Error(result.reason);
    const view = result.data;

    expect(view.gameweek).toEqual({ id: 5, status: "final", provisional: false });
    expect(view.market).toHaveLength(standings.standings.results.length);
    expect(view.table).toHaveLength(standings.standings.results.length);
    expect(view.market.filter((r) => r.manager.isYou)).toHaveLength(1);
    expect([...view.awards.map((a) => a.id), ...view.skipped].sort()).toEqual([...AWARD_ORDER].sort());
    expect(view.teamOfTheWeek.players).toHaveLength(dreamTeam.team.length);
  });

  it("uses first names only", async () => {
    stubFpl();
    const result = await getLeagueView(314, { now: CAPTURED_AT });
    if (!result.ok) throw new Error(result.reason);
    expect(JSON.stringify(result.data)).not.toContain("Surname");
    expect(result.data.market[0].manager.firstName).toMatch(/^Manager\d$/);
  });

  it("scores net of hits from the real -4 week", async () => {
    stubFpl();
    const result = await getLeagueView(314, { gw: 5, now: CAPTURED_AT });
    if (!result.ok) throw new Error(result.reason);
    expect(result.data.market[0].score).toEqual({ net: 67, points: 71, hits: 4 });
    expect(result.data.awards.find((a) => a.id === "hitMerchant")?.stat).toBe(4);
  });

  it("reports an unknown league and a gameweek that hasn't started", async () => {
    stubFpl((path) => (path.startsWith("/api/leagues-classic/") ? 404 : undefined));
    await expect(getLeagueView(1, { gw: 5, now: CAPTURED_AT })).resolves.toEqual({
      ok: false,
      reason: "league-not-found",
    });
    await expect(getLeagueView(1, { gw: 7, now: CAPTURED_AT })).resolves.toEqual({ ok: false, reason: "not-started" });
  });
});
