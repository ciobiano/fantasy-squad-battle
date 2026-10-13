import { afterEach, describe, expect, it, vi } from "vitest";
import type { LeagueSource } from "./league";
import { SAMPLE_MARKET } from "./market";
import { loadStory, type StoryView } from "./story";

afterEach(() => {
  vi.restoreAllMocks();
});

const none: LeagueSource = { standings: async () => null, latestGameweek: async () => 5, market: async () => null };
const real: LeagueSource = { ...none, market: async () => ({ ...SAMPLE_MARKET, leagueId: "314", awards: ["oga", "spoon"] }) };

async function view(...args: Parameters<typeof loadStory>): Promise<StoryView> {
  const screen = await loadStory(...args);
  if (screen.kind !== "ready") throw new Error(screen.kind);
  return screen.view;
}

describe("loadStory", () => {
  it("plays the Wrap first, then each award in story order, opening at the linked card", async () => {
    const v = await view("sample", "captain", "pcm", none);
    expect(v.cards.map((c) => c.key)).toEqual(["wrap", "oga", "climber", "captain", "bench", "hits", "middle", "faller", "spoon"]);
    expect(v.index).toBe(3);
    expect(v.cards[3].href).toBe("/league/sample/story/captain");
    expect(v.closeHref).toBe("/league/sample");
  });
  it("gives every card both sizes in both themes, in the reader's language", async () => {
    const card = (await view("sample", "wrap", "fr", none)).cards[0];
    expect(card.images.status.light).toBe("/cards/sample/5/wrap?format=status&theme=light&lang=fr");
    expect(card.images.x.dark).toBe("/cards/sample/5/wrap?format=x&theme=dark&lang=fr");
  });
  it("only has cards for awards somebody won", async () => {
    expect((await view("314", "spoon", "en", real)).cards.map((c) => c.key)).toEqual(["wrap", "oga", "spoon"]);
    expect(await loadStory("314", "hits", "en", real)).toEqual({ kind: "not-found" });
  });
  it("sends a league without stories yet back to its page, and refuses a bad league", async () => {
    expect(await loadStory("314", "wrap", "en", none)).toEqual({ kind: "redirect", to: "/league/314" });
    expect(await loadStory("abc", "wrap", "en", none)).toEqual({ kind: "not-found" });
  });
  it("shows the down panel when FPL can't be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const down: LeagueSource = { ...none, market: async () => Promise.reject(new Error("503")) };
    expect(await loadStory("314", "wrap", "en", down)).toEqual({ kind: "down", retry: "/league/314/story/wrap" });
  });
});
