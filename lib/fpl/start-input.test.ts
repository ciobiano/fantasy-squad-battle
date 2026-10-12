import { describe, expect, it } from "vitest";
import { parseLeagueInput, parseStartInput } from "./start-input";

describe("parseStartInput", () => {
  it.each([
    ["1234567", "team", { ok: true, kind: "team", teamId: 1234567 }],
    ["1234567", "league", { ok: true, kind: "league", leagueId: 1234567 }],
    // Links decide for themselves, whatever mode is selected.
    ["https://fantasy.premierleague.com/entry/689819/event/6", "league", { ok: true, kind: "team", teamId: 689819 }],
    ["fantasy.premierleague.com/entry/689819/history", "team", { ok: true, kind: "team", teamId: 689819 }],
    ["https://fantasy.premierleague.com/entry/689819", "team", { ok: true, kind: "team", teamId: 689819 }],
    ["https://fantasy.premierleague.com/leagues/88/standings/c", "team", { ok: true, kind: "league", leagueId: 88 }],
  ] as const)("reads %s in %s mode", (input, mode, expected) => {
    expect(parseStartInput(input, mode)).toEqual(expected);
  });

  it.each([
    ["", "team", "empty"],
    ["0", "team", "not-a-team"],
    ["0", "league", "not-a-league"],
    ["my team", "team", "not-a-team"],
    ["https://fantasy.premierleague.com/entry/abc/history", "team", "not-a-team"],
    ["https://fantasy.premierleague.com/entrybad/123", "team", "not-a-team"],
    ["https://fantasy.premierleague.com/leagues/123/standings/h", "team", "head-to-head"],
    ["https://draft.premierleague.com/entry/123/event/5", "team", "draft"],
    ["https://fantasy.premierleague.com/leagues/auto-join/abc123", "team", "invite-code"],
  ] as const)("rejects %j in %s mode as %s", (input, mode, error) => {
    expect(parseStartInput(input, mode)).toEqual({ ok: false, error });
  });
});

describe("parseLeagueInput", () => {
  it.each([
    ["314", 314],
    ["  1234567 ", 1234567],
    ["https://fantasy.premierleague.com/leagues/1234567/standings/c", 1234567],
    ["https://fantasy.premierleague.com/leagues/1234567/standings/c/", 1234567],
    ["fantasy.premierleague.com/leagues/1234567/standings/c", 1234567],
    ["http://www.fantasy.premierleague.com/leagues/88/standings/c?phase=1", 88],
  ])("reads %s as league %i", (input, leagueId) => {
    expect(parseLeagueInput(input)).toEqual({ ok: true, leagueId });
  });

  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["0", "not-a-league"],
    ["12345678901", "not-a-league"],
    ["my league", "not-a-league"],
    ["https://example.com/leagues/123/standings/c", "not-a-league"],
    ["https://fantasy.premierleague.com/entry/123/history", "not-a-league"],
    ["https://fantasy.premierleague.com/leagues/123/standings/h", "head-to-head"],
    ["https://draft.premierleague.com/league/123", "draft"],
    ["https://fantasy.premierleague.com/leagues/auto-join/abc123", "invite-code"],
  ])("rejects %j as %s", (input, error) => {
    expect(parseLeagueInput(input)).toEqual({ ok: false, error });
  });
});
