import { describe, expect, it } from "vitest";
import { isAllowedFplRequest, keysMatch } from "./allow";

const allowed = (pathAndQuery: string) => {
  const url = new URL(pathAndQuery, "https://relay.example");
  return isAllowedFplRequest(url.pathname, url.searchParams);
};

describe("isAllowedFplRequest", () => {
  it.each([
    "/api/bootstrap-static/",
    "/api/fixtures/?event=6",
    "/api/event/6/live/",
    "/api/dream-team/5/",
    "/api/entry/689819/",
    "/api/entry/689819/history/",
    "/api/entry/689819/transfers/",
    "/api/entry/689819/event/5/picks/",
    "/api/leagues-classic/314/standings/?page_standings=2",
    "/api/element-summary/552/",
  ])("allows %s", (path) => {
    expect(allowed(path)).toBe(true);
  });

  it.each([
    "/api/me/",
    "/api/my-team/123/",
    "/api/entry/123/transfers/latest/",
    "/api/entry/abc/history/",
    "/api/leagues-classic/314/standings/?page_standings=2&x=1",
    "/api/fixtures/?event=6;drop",
    "/admin/",
    "/api/bootstrap-static",
    "/api/element-summary/1234567/",
  ])("refuses %s", (path) => {
    expect(allowed(path)).toBe(false);
  });
});

describe("keysMatch", () => {
  it("matches identical keys", () => {
    expect(keysMatch("s3cret-key", "s3cret-key")).toBe(true);
  });

  it.each([null, "", "s3cret-kez", "s3cret", "s3cret-key-longer"])("rejects %s", (provided) => {
    expect(keysMatch(provided, "s3cret-key")).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    expect(keysMatch("", "")).toBe(false);
  });
});
