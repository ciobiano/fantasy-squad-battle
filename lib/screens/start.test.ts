import { describe, expect, it } from "vitest";
import { findDestination, startHref, startView } from "./start";

describe("startView", () => {
  it("defaults to the team mode with nothing typed", () => {
    expect(startView({})).toEqual({ mode: "team", value: "", error: null });
  });
  it("keeps what was typed and a reason Start knows", () => {
    expect(startView({ mode: "league", q: "314", error: "league-not-found" })).toEqual({ mode: "league", value: "314", error: "league-not-found" });
  });
  it("drops a reason it doesn't know and clips long input", () => {
    const view = startView({ error: "<script>", q: "9".repeat(500), mode: ["league", "team"] });
    expect(view.error).toBeNull();
    expect(view.value).toHaveLength(300);
    expect(view.mode).toBe("league");
  });
});

describe("findDestination", () => {
  it("sends a team ID to its league picker and a league link to the league", () => {
    expect(findDestination({ mode: "team", q: " 1234567 " })).toBe("/team/1234567");
    expect(findDestination({ mode: "team", q: "https://fantasy.premierleague.com/leagues/314/standings/c" })).toBe("/league/314");
  });
  it("goes back to Start with the reason and what was typed", () => {
    expect(findDestination({ mode: "league", q: "hello" })).toBe(startHref("league", "hello", "not-a-league"));
    expect(findDestination({})).toBe("/?start=1&mode=team&q=&error=empty");
  });
});
