import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bootstrap from "./__fixtures__/bootstrap.json";
import dreamTeam from "./__fixtures__/dream-team.json";
import fixtures from "./__fixtures__/fixtures.json";
import history from "./__fixtures__/history.json";
import live from "./__fixtures__/live.json";
import picks from "./__fixtures__/picks.json";
import standings from "./__fixtures__/standings.json";
import { MAX_MANAGERS, getLeagueGameweek, resolveGameweek } from "./league-gameweek";

// 'use cache: remote' is a no-op string outside Next; only the cache API needs stubbing.
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const CAPTURED_AT = Date.parse("2026-10-09T12:00:00Z");

type Route = (path: string) => { status: number; body?: unknown } | undefined;

const json = (status: number, body: unknown = { detail: "Not found." }) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const realFpl: Route = (path) => {
  if (path === "/api/bootstrap-static/") return { status: 200, body: bootstrap };
  if (path === "/api/fixtures/") return { status: 200, body: fixtures };
  if (/^\/api\/leagues-classic\/\d+\/standings\/$/.test(path)) return { status: 200, body: standings };
  if (/^\/api\/entry\/\d+\/history\/$/.test(path)) return { status: 200, body: history };
  if (/^\/api\/entry\/\d+\/event\/\d+\/picks\/$/.test(path)) return { status: 200, body: picks };
  if (/^\/api\/event\/\d+\/live\/$/.test(path)) return { status: 200, body: live };
  if (/^\/api\/dream-team\/\d+\/$/.test(path)) return { status: 200, body: dreamTeam };
  return undefined;
};

function stubFpl(...overrides: Route[]) {
  const fetchMock = vi.fn(async (input: URL | string) => {
    const path = new URL(String(input)).pathname;
    const hit = [...overrides, realFpl].map((route) => route(path)).find(Boolean);
    return hit ? json(hit.status, hit.body) : json(404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const managerIds = standings.standings.results.map((r) => r.entry);

async function load(leagueId: number, gw: number) {
  const result = await getLeagueGameweek(leagueId, gw, "final");
  if (!result.ok) throw new Error(`expected a league, got ${result.reason}`);
  return result.data;
}

beforeEach(() => {
  vi.stubEnv("FPL_RELAY_URL", "");
  vi.stubEnv("FPL_RELAY_KEY", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getLeagueGameweek", () => {
  it("bundles the league, each manager's history and picks, and the gameweek's players", async () => {
    stubFpl();
    const data = await load(314, 5);

    expect(data.league).toEqual({ id: 314, name: standings.league.name });
    expect(data.gameweek).toMatchObject({ id: 5, status: "final" });
    expect(data.managers.map((m) => m.entry)).toEqual(managerIds);
    expect(data.managers[0]).toMatchObject({ entryName: "Team 1 FC", playerName: "Manager1 Surname1" });
    expect(data.managers.every((m) => m.history.current.every((row) => row.event <= 5))).toBe(true);
    expect(data.managers[0].picks?.entry_history.event_transfers_cost).toBe(4);
  });

  it("keeps only the players someone picked or that made the dream team", async () => {
    stubFpl();
    const data = await load(314, 5);

    const expected = new Set([...picks.picks.map((p) => p.element), ...dreamTeam.team.map((p) => p.element)]);
    expect(new Set(data.players.map((p) => p.id))).toEqual(expected);
    expect(Object.keys(data.livePoints).map(Number).every((id) => expected.has(id))).toBe(true);
    expect(data.teams.length).toBeGreaterThan(0);
  });

  it("flags a league with more managers than the app covers", async () => {
    stubFpl();
    const data = await load(314, 5);
    expect(data.truncated).toBe(standings.standings.has_next);
  });

  it("gives a manager who hadn't started yet null picks instead of failing", async () => {
    const late = managerIds[1];
    stubFpl((path) => (path === `/api/entry/${late}/event/5/picks/` ? { status: 404 } : undefined));

    const data = await load(314, 5);
    expect(data.managers.find((m) => m.entry === late)?.picks).toBeNull();
  });

  it("returns league-not-found for an unknown league (a value, not an error)", async () => {
    stubFpl((path) => (path.startsWith("/api/leagues-classic/") ? { status: 404 } : undefined));
    await expect(getLeagueGameweek(1, 5, "final")).resolves.toEqual({
      ok: false,
      reason: "league-not-found",
    });
  });

  it("fails rather than returning partial data when a manager can't be loaded", async () => {
    stubFpl((path) => (path === `/api/entry/${managerIds[2]}/history/` ? { status: 404 } : undefined));
    await expect(getLeagueGameweek(314, 5, "final")).rejects.toThrow(/history/);
  });

  it(`never has more than 6 manager requests in flight, and stops at ${MAX_MANAGERS} managers`, async () => {
    const row = standings.standings.results[0];
    const big = {
      ...standings,
      standings: {
        ...standings.standings,
        has_next: true,
        results: Array.from({ length: MAX_MANAGERS + 10 }, (_, i) => ({ ...row, entry: 1000 + i })),
      },
    };
    let inFlight = 0;
    let peak = 0;
    const fetchMock = stubFpl((path) =>
      path.startsWith("/api/leagues-classic/") ? { status: 200, body: big } : undefined,
    );
    const route = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input) => {
      const isManager = new URL(String(input)).pathname.startsWith("/api/entry/");
      if (isManager) peak = Math.max(peak, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, 2));
      if (isManager) inFlight--;
      return route(input);
    });

    const data = await load(314, 5);
    expect(data.managers).toHaveLength(MAX_MANAGERS);
    expect(data.truncated).toBe(true);
    expect(peak).toBeLessThanOrEqual(6);
  });
});

describe("resolveGameweek", () => {
  it("defaults to the newest gameweek with unlocked cards", async () => {
    stubFpl();
    await expect(resolveGameweek(undefined, CAPTURED_AT)).resolves.toEqual({
      ok: true,
      id: 5,
      status: "final",
    });
  });

  it("refuses a gameweek whose deadline hasn't passed", async () => {
    stubFpl();
    await expect(resolveGameweek(7, CAPTURED_AT)).resolves.toEqual({ ok: false, reason: "not-started" });
  });

  it("refuses a gameweek that doesn't exist", async () => {
    stubFpl();
    await expect(resolveGameweek(99, CAPTURED_AT)).resolves.toEqual({
      ok: false,
      reason: "no-such-gameweek",
    });
  });
});
