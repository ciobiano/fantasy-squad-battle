import { describe, expect, it } from "vitest";
import { fplId } from "./ids";
import { LEAGUE_COOKIE, TEAM_COOKIE, onVisit, readRecentTeams, readWatched, rememberedTeamId, watchedKey, withRecentTeam, withWatched } from "./remembered";

const jar = (cookies: Record<string, string>) => (name: string) => cookies[name];
const visit = (path: string, cookies: Record<string, string> = {}) => {
  const url = new URL(path, "https://example.test");
  return onVisit(url.pathname, url.searchParams, jar(cookies));
};

describe("fplId", () => {
  it("accepts plain positive numbers of up to 10 digits only", () => {
    expect(fplId("314159")).toBe(314159);
    expect(fplId("0")).toBeNull();
    expect(fplId("12a")).toBeNull();
    expect(fplId("/evil")).toBeNull();
    expect(fplId("12345678901")).toBeNull();
    expect(fplId(undefined)).toBeNull();
  });
});

describe("onVisit", () => {
  it("opens the last league from the home screen", () => {
    expect(visit("/", { [LEAGUE_COOKIE]: "314" })).toEqual({ kind: "redirect", to: "/league/314" });
  });
  it("shows Start when the link asks for it, or nothing valid is saved", () => {
    expect(visit("/?start=1", { [LEAGUE_COOKIE]: "314" })).toEqual({ kind: "continue", save: [] });
    expect(visit("/", { [LEAGUE_COOKIE]: "//evil" })).toEqual({ kind: "continue", save: [] });
    expect(visit("/")).toEqual({ kind: "continue", save: [] });
  });
  it("saves the team or league a page carries", () => {
    expect(visit("/team/1234567")).toEqual({ kind: "continue", save: [{ name: TEAM_COOKIE, value: "1234567" }] });
    expect(visit("/league/314")).toEqual({ kind: "continue", save: [{ name: LEAGUE_COOKIE, value: "314" }] });
    expect(visit("/league/314/table")).toEqual({ kind: "continue", save: [{ name: LEAGUE_COOKIE, value: "314" }] });
  });
  it("saves nothing for the sample league or a bad team ID", () => {
    expect(visit("/league/sample")).toEqual({ kind: "continue", save: [] });
    expect(visit("/team/0")).toEqual({ kind: "continue", save: [] });
  });
  it("refuses a league page whose ID isn't one, before it renders", () => {
    expect(visit("/league/abc")).toEqual({ kind: "not-found" });
    expect(visit("/league/0/table")).toEqual({ kind: "not-found" });
    expect(visit("/league/sample/table")).toEqual({ kind: "continue", save: [] });
  });
  it("refuses a share page link that isn't well formed, and saves nothing for a good one", () => {
    expect(visit("/s/abc/5")).toEqual({ kind: "not-found" });
    expect(visit("/s/314/0")).toEqual({ kind: "not-found" });
    expect(visit("/s/314/5")).toEqual({ kind: "continue", save: [] });
  });
  it("refuses a story link for a card that doesn't exist, and remembers a real one's league", () => {
    expect(visit("/league/314/story/banana")).toEqual({ kind: "not-found" });
    expect(visit("/league/abc/story/oga")).toEqual({ kind: "not-found" });
    expect(visit("/league/314/story/spoon")).toEqual({ kind: "continue", save: [{ name: LEAGUE_COOKIE, value: "314" }] });
  });
});

describe("onVisit, Planner", () => {
  it("opens the last team's rating from the Planner tab, unless the link asks for Start", () => {
    expect(visit("/planner", { [TEAM_COOKIE]: "3920688" })).toEqual({ kind: "redirect", to: "/planner/3920688" });
    expect(visit("/planner?start=1", { [TEAM_COOKIE]: "3920688" })).toEqual({ kind: "continue", save: [] });
    expect(visit("/planner")).toEqual({ kind: "continue", save: [] });
  });
  it("saves the team a planner page carries, and refuses one that isn't a team ID", () => {
    const saved = { kind: "continue", save: [{ name: TEAM_COOKIE, value: "3920688" }] };
    expect(visit("/planner/3920688")).toEqual(saved);
    expect(visit("/planner/3920688/plan")).toEqual(saved);
    expect(visit("/planner/abc")).toEqual({ kind: "not-found" });
    expect(visit("/planner/0/plan")).toEqual({ kind: "not-found" });
  });
  it("lets the draft and the Start form's target through, saving nothing", () => {
    expect(visit("/planner/draft")).toEqual({ kind: "continue", save: [] });
    expect(visit("/planner/find?q=1")).toEqual({ kind: "continue", save: [] });
  });
  it("saves the league Your team is compared in, and only from Your team", () => {
    const team = { name: TEAM_COOKIE, value: "3920688" };
    expect(visit("/planner/3920688?league=314")).toEqual({ kind: "continue", save: [team, { name: LEAGUE_COOKIE, value: "314" }] });
    expect(visit("/planner/3920688?league=abc")).toEqual({ kind: "continue", save: [team] });
    expect(visit("/planner/3920688/plan?league=314")).toEqual({ kind: "continue", save: [team] });
  });
  it("treats League On paper like the other League views", () => {
    expect(visit("/league/314/paper")).toEqual({ kind: "continue", save: [{ name: LEAGUE_COOKIE, value: "314" }] });
    expect(visit("/league/abc/paper")).toEqual({ kind: "not-found" });
  });
});

describe("rememberedTeamId", () => {
  it("reads a valid saved team only", () => {
    expect(rememberedTeamId(jar({ [TEAM_COOKIE]: "22" }))).toBe(22);
    expect(rememberedTeamId(jar({ [TEAM_COOKIE]: "x" }))).toBeNull();
  });
});

describe("recent teams", () => {
  const a = { id: 1, name: "PASUZAE", manager: "Amaka" };
  const b = { id: 2, name: "B2B Trini", manager: "JB" };
  it("puts the latest team first, once, and keeps five", () => {
    const stored = withRecentTeam(withRecentTeam(null, a), b);
    expect(readRecentTeams(stored)).toEqual([b, a]);
    expect(readRecentTeams(withRecentTeam(stored, a))).toEqual([a, b]);
    const many = [3, 4, 5, 6, 7].reduce((s, id) => withRecentTeam(s, { ...a, id }), stored);
    expect(readRecentTeams(many).map((t) => t.id)).toEqual([7, 6, 5, 4, 3]);
  });
  it("drops anything unreadable", () => {
    expect(readRecentTeams("{")).toEqual([]);
    expect(readRecentTeams(JSON.stringify([a, { id: "x", name: 1 }, null]))).toEqual([a]);
  });
});

describe("watched stories", () => {
  it("adds a card once and reads it back", () => {
    const once = withWatched(null, "oga");
    expect([...readWatched(withWatched(once, "oga"))]).toEqual(["oga"]);
    expect([...readWatched(withWatched(once, "spoon"))]).toEqual(["oga", "spoon"]);
  });
  it("treats anything unreadable as nothing watched", () => {
    expect(readWatched("not json").size).toBe(0);
    expect(readWatched('{"oga":true}').size).toBe(0);
    expect([...readWatched('["oga", 3]')]).toEqual(["oga"]);
  });
  it("keeps each league's gameweek apart", () => {
    expect(watchedKey("314", 5)).not.toBe(watchedKey("314", 6));
  });
});
