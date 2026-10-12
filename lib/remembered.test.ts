import { describe, expect, it } from "vitest";
import { fplId } from "./ids";
import { LEAGUE_COOKIE, TEAM_COOKIE, onVisit, rememberedTeamId } from "./remembered";

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
  it("saves nothing for the sample league or a bad ID", () => {
    expect(visit("/league/sample")).toEqual({ kind: "continue", save: [] });
    expect(visit("/team/0")).toEqual({ kind: "continue", save: [] });
    expect(visit("/league/314/market")).toEqual({ kind: "continue", save: [] });
  });
});

describe("rememberedTeamId", () => {
  it("reads a valid saved team only", () => {
    expect(rememberedTeamId(jar({ [TEAM_COOKIE]: "22" }))).toBe(22);
    expect(rememberedTeamId(jar({ [TEAM_COOKIE]: "x" }))).toBeNull();
  });
});
