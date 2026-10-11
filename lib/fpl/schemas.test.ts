import { describe, expect, it } from "vitest";
import type { z } from "zod";
import bootstrap from "./__fixtures__/bootstrap.json";
import dreamTeam from "./__fixtures__/dream-team.json";
import fixtures from "./__fixtures__/fixtures.json";
import history from "./__fixtures__/history.json";
import live from "./__fixtures__/live.json";
import picks from "./__fixtures__/picks.json";
import standings from "./__fixtures__/standings.json";
import {
  FplSchemaError,
  bootstrapSchema,
  dreamTeamSchema,
  fixturesSchema,
  historySchema,
  liveSchema,
  parseFpl,
  picksSchema,
  standingsSchema,
} from "./schemas";

// Fixtures are trimmed, anonymised real responses from 2026/27 GW5.

describe("schemas accept real FPL responses", () => {
  it.each([
    ["bootstrap", bootstrapSchema, bootstrap],
    ["fixtures", fixturesSchema, fixtures],
    ["standings", standingsSchema, standings],
    ["history", historySchema, history],
    ["picks", picksSchema, picks],
    ["live", liveSchema, live],
    ["dream-team", dreamTeamSchema, dreamTeam],
  ] as const)("%s", (name, schema, data) => {
    expect(() => parseFpl(schema as z.ZodType<unknown>, data, name)).not.toThrow();
  });

  it("strips fields the app doesn't use", () => {
    const parsed = parseFpl(standingsSchema, standings, "standings");
    expect(Object.keys(parsed.standings.results[0]).sort()).toEqual(
      ["entry", "entry_name", "event_total", "last_rank", "player_name", "rank", "total"].sort(),
    );
  });

  it("keeps the facts the awards depend on", () => {
    const parsed = parseFpl(picksSchema, picks, "picks");
    expect(parsed.entry_history).toMatchObject({ event: 5, points: 71, event_transfers_cost: 4 });
    expect(parsed.automatic_subs).toEqual([{ element_in: 41, element_out: 165 }]);
    expect(parsed.picks.filter((p) => p.is_captain)).toHaveLength(1);
  });
});

describe("parseFpl", () => {
  it("names the endpoint and the problem when FPL changes shape", () => {
    const broken = { ...standings, standings: { ...standings.standings, results: [{ entry: "x" }] } };
    expect(() => parseFpl(standingsSchema, broken, "leagues-classic/1/standings/")).toThrow(
      FplSchemaError,
    );
    expect(() => parseFpl(standingsSchema, broken, "leagues-classic/1/standings/")).toThrow(
      /leagues-classic\/1\/standings\/[\s\S]*entry/,
    );
  });
});
