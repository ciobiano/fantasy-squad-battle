import { afterEach, describe, expect, it, vi } from "vitest";
import type { LeagueSource } from "./league";
import { SAMPLE_MARKET } from "./market";
import { loadSharePage, type ShareView } from "./share";
import { liveSource, missingSource, preseasonSource } from "./testing";

afterEach(() => {
  vi.restoreAllMocks();
});

const none = preseasonSource();

async function view(...args: Parameters<typeof loadSharePage>): Promise<ShareView> {
  const screen = await loadSharePage(...args);
  if (screen.kind !== "ready") throw new Error(screen.kind);
  return screen.view;
}

describe("loadSharePage", () => {
  it("shows the Wrap, every award in story order and the standings", async () => {
    const v = await view("sample", "5", "en", none);
    expect(v.awards.map((a) => a.key)).toEqual(SAMPLE_MARKET.awards);
    expect(v.awards[0].href).toBe("/league/sample/story/oga");
    expect(v.wrap.images.light).toBe("/cards/sample/5/wrap?format=x&theme=light&lang=en&preview=1");
    expect(v.table.rows).toHaveLength(12);
  });
  it("previews links with the dark, square Wrapped card", async () => {
    expect((await view("sample", "5", "fr", none)).previewImage).toBe("/cards/sample/5/wrap?format=x&theme=dark&lang=fr");
  });
  it("has no page for another gameweek, a bad gameweek or a bad league", async () => {
    for (const [league, gw] of [["sample", "6"], ["sample", "05"], ["sample", "39"], ["abc", "5"]]) {
      expect(await loadSharePage(league, gw, "en", none)).toEqual({ kind: "not-found" });
    }
  });
  it("shows a real league's gameweek, with its standings after it", async () => {
    const v = await view("314", "5", "en", liveSource());
    expect(v).toMatchObject({ leagueName: "Denizens of Olympus", gw: 5, previewImage: "/cards/314/5/wrap?format=x&theme=dark&lang=en" });
    expect(v.table.rows.map((r) => r.firstName)).toEqual(["Tobi", "Emeka", "Kemi", "Bayo", "Chidi", "Ngozi"]);
  });
  it("sends a league without awards yet to its page, and shows the down panel on an outage", async () => {
    expect(await loadSharePage("314", "5", "en", none)).toEqual({ kind: "redirect", to: "/league/314" });
    expect(await loadSharePage("314", "5", "en", missingSource())).toEqual({ kind: "not-found" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const down: LeagueSource = { ...none, view: async () => Promise.reject(new Error("503")) };
    expect(await loadSharePage("314", "5", "en", down)).toEqual({ kind: "down", retry: "/s/314/5" });
  });
});
