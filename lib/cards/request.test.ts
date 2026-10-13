import { describe, expect, it } from "vitest";
import { cardQueries } from "./query";
import { cacheControl, cardRequest, cardUrl } from "./request";

const params = (gw: string, award: string) => ({ league: "314", gw, award });
const query = (text = "") => new URLSearchParams(text);

describe("cardRequest", () => {
  it("defaults to a dark Status card in Pidgin", () => {
    expect(cardRequest(params("5", "wrap"), query())).toEqual({
      league: "314",
      gw: 5,
      kind: { kind: "wrap" },
      options: { format: "status", theme: "dark", lang: "pcm" },
      provisional: false,
    });
  });
  it("reads known options and ignores anything else", () => {
    expect(cardRequest(params("5", "spoon"), query("format=x&theme=light&lang=fr&provisional=1"))).toMatchObject({
      kind: { kind: "award", award: "spoon" },
      options: { format: "x", theme: "light", lang: "fr" },
      provisional: true,
    });
    expect(cardRequest(params("5", "oga"), query("format=gif&theme=pink&lang=de"))?.options).toEqual({ format: "status", theme: "dark", lang: "pcm" });
  });
  it("accepts the Wrap and the eight awards only", () => {
    expect(cardRequest(params("5", "toString"), query())).toBeNull();
    expect(cardRequest(params("5", "../etc"), query())).toBeNull();
  });
  it("accepts gameweeks 1 to 38 only", () => {
    expect(cardRequest(params("38", "wrap"), query())?.gw).toBe(38);
    for (const gw of ["0", "39", "5a", "005"]) expect(cardRequest(params(gw, "wrap"), query())).toBeNull();
  });
});

describe("cardUrl", () => {
  it("builds the URL cardRequest reads back", () => {
    const url = new URL(cardUrl("314", 5, "spoon", { format: "x", theme: "light", lang: "fr" }), "https://example.test");
    const [, , league, gw, award] = url.pathname.split("/");
    expect(cardRequest({ league, gw, award }, url.searchParams)).toMatchObject({
      league: "314", gw: 5, kind: { kind: "award", award: "spoon" }, options: { format: "x", theme: "light", lang: "fr" },
    });
  });
  it("only ever produces one of the queries the image optimiser allows", () => {
    expect(cardQueries()).toHaveLength(12);
    expect(cardQueries()).toContain(new URL(cardUrl("sample", 5, "wrap", { format: "status", theme: "dark", lang: "pcm" }), "https://x.test").search);
  });
});

describe("cacheControl", () => {
  it("caches final gameweeks for longer than provisional ones", () => {
    expect(cacheControl(false)).toContain("s-maxage=86400");
    expect(cacheControl(true)).toContain("s-maxage=300");
  });
});
