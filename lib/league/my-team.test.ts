import { afterEach, describe, expect, it, vi } from "vitest";
import entry from "@/lib/fpl/__fixtures__/entry.json";
import { entrySchema, parseFpl } from "@/lib/fpl/schemas";
import { getMyTeam, toMyTeam } from "./my-team";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

// entry.json: an anonymised real manager in 13 classic leagues (2026-10-10).
const parsed = parseFpl(entrySchema, entry, "entry");

describe("toMyTeam", () => {
  const team = toMyTeam(parsed);

  it("keeps the first name and team name, and never the surname", () => {
    expect(team).toMatchObject({ id: entry.id, firstName: "Ade", teamName: "Test Team FC" });
    expect(JSON.stringify(team)).not.toContain("Surname");
  });

  it("lists every classic league", () => {
    expect(team.leagues).toHaveLength(entry.leagues.classic.length);
  });

  it("puts player-made leagues first, smallest first, so friend groups lead", () => {
    const kinds = team.leagues.map((l) => l.kind);
    expect(kinds.indexOf("public")).toBe(kinds.filter((k) => k === "private").length);
    const privateSizes = team.leagues.filter((l) => l.kind === "private").map((l) => l.members ?? Infinity);
    expect(privateSizes).toEqual([...privateSizes].sort((a, b) => a - b));
    expect(team.leagues[0].members).toBe(12);
  });

  it("puts FPL's own leagues after, with unstarted leagues last", () => {
    const publicLeagues = team.leagues.filter((l) => l.kind === "public");
    expect(publicLeagues.at(-1)).toMatchObject({ name: "Second Chance", members: null, rank: null });
    expect(publicLeagues.map((l) => l.name)).toContain("Overall");
  });

  it("turns FPL's 0 rank (not ranked yet) into null", () => {
    expect(team.leagues.every((l) => l.rank === null || l.rank > 0)).toBe(true);
  });
});

describe("getMyTeam", () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubFetch = (status: number, body: unknown) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })),
    );

  it("returns the team for a known team ID", async () => {
    stubFetch(200, entry);
    const result = await getMyTeam(entry.id);
    expect(result.ok && result.data.teamName).toBe("Test Team FC");
  });

  it("returns team-not-found (a value, not an error) for an unknown team ID", async () => {
    stubFetch(404, { detail: "Not found." });
    await expect(getMyTeam(1)).resolves.toEqual({ ok: false, reason: "team-not-found" });
  });
});
