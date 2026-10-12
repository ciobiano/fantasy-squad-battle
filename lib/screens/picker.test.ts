import { afterEach, describe, expect, it, vi } from "vitest";
import type { MyTeam } from "@/lib/league/my-team";
import { loadPicker, type PickerSource } from "./picker";

const team: MyTeam = {
  id: 1234567,
  firstName: "Emeka",
  teamName: "Agbero Athletic",
  leagues: [
    { id: 1, name: "Ikeja Banter League", kind: "private", members: 12, rank: 8, lastRank: 10 },
    { id: 2, name: "Lekki Ballers", kind: "private", members: 20, rank: null, lastRank: null },
    { id: 3, name: "Overall", kind: "public", members: 11_000_000, rank: 1_204_555, lastRank: 1_391_020 },
  ],
};

const found: PickerSource = { myTeam: async () => ({ ok: true, data: team }) };


afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadPicker", () => {
  it("splits your leagues from public ones, keeping the order", async () => {
    const screen = await loadPicker("1234567", found);
    if (screen.kind !== "ready") throw new Error(screen.kind);
    expect(screen.view.yours.map((r) => r.name)).toEqual(["Ikeja Banter League", "Lekki Ballers"]);
    expect(screen.view.public.map((r) => r.name)).toEqual(["Overall"]);
    expect(screen.view.badge.initials).toBe("AA");
  });
  it("shows places moved for your leagues and only the arrow for public ones", async () => {
    const screen = await loadPicker("1234567", found);
    if (screen.kind !== "ready") throw new Error(screen.kind);
    expect(screen.view.yours[0]).toMatchObject({ rank: "8", move: { direction: "up", places: 2 }, showPlaces: true });
    expect(screen.view.yours[1].rank).toBeNull();
    expect(screen.view.public[0]).toMatchObject({ rank: "1.2M", move: { direction: "up" }, showPlaces: false });
  });
  it("sends a bad or unknown team back to Start with the reason", async () => {
    const missing: PickerSource = { myTeam: async () => ({ ok: false, reason: "team-not-found" }) };
    expect(await loadPicker("abc", found)).toEqual({ kind: "redirect", to: "/?start=1&mode=team&q=abc&error=not-a-team" });
    expect(await loadPicker("99", missing)).toEqual({ kind: "redirect", to: "/?start=1&mode=team&q=99&error=team-not-found" });
  });
  it("shows the down panel when FPL can't be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const down: PickerSource = { myTeam: async () => Promise.reject(new Error("503")) };
    expect(await loadPicker("1234567", down)).toEqual({ kind: "down", retry: "/team/1234567" });
  });
});
