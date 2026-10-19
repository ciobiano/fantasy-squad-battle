import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as health } from "./health/route";
import { GET as leagueBundle } from "./league/[leagueId]/route";
import { GET as leagueView } from "./league/[leagueId]/view/route";
import { GET as planner } from "./planner/route";
import { GET as paper } from "./planner/league/[leagueId]/route";
import { GET as team } from "./team/[teamId]/route";
import { GET as tools } from "./tools/route";
import { inspectionAllowed } from "./inspection";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => {}), after: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("inspection endpoints", () => {
  it("answer on previews and locally, never on production", () => {
    expect(inspectionAllowed({ VERCEL_ENV: "production" })).toBe(false);
    expect(inspectionAllowed({ VERCEL_ENV: "preview" })).toBe(true);
    expect(inspectionAllowed({})).toBe(true);
  });

  it("all hide on production, before touching FPL", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const params = <T,>(value: T) => ({ params: Promise.resolve(value) });
    const responses = await Promise.all([
      health(),
      tools(new Request("https://fsb.example/api/tools")),
      leagueBundle(new Request("https://fsb.example/api/league/314"), params({ leagueId: "314" })),
      leagueView(new Request("https://fsb.example/api/league/314/view"), params({ leagueId: "314" })),
      team(new Request("https://fsb.example/api/team/1"), params({ teamId: "1" })),
      planner(new Request("https://fsb.example/api/planner?team=1")),
      paper(new Request("https://fsb.example/api/planner/league/314"), params({ leagueId: "314" })),
    ]);
    expect(responses.map((r) => r.status)).toEqual([404, 404, 404, 404, 404, 404, 404]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
