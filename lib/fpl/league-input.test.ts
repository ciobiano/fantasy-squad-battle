import { describe, expect, it } from "vitest";
import { parseLeagueInput } from "./league-input";

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
