import { describe, expect, it } from "vitest";
import { gameweekStatus, latestUnlockedGameweek } from "./gameweek";
import type { Event, Fixture } from "./schemas";

const NOW = Date.parse("2026-10-09T12:00:00Z");

const event = (id: number, overrides: Partial<Event> = {}): Event => ({
  id,
  name: `Gameweek ${id}`,
  deadline_time: "2026-10-03T10:00:00Z",
  average_entry_score: 50,
  finished: false,
  data_checked: false,
  is_previous: false,
  is_current: false,
  is_next: false,
  ...overrides,
});

const fixture = (gw: number, overrides: Partial<Fixture> = {}): Fixture => ({
  id: gw * 100 + Math.floor(Math.random() * 99),
  event: gw,
  kickoff_time: null,
  started: false,
  finished: false,
  finished_provisional: false,
  team_h: 1,
  team_a: 2,
  ...overrides,
});

const done = { started: true, finished_provisional: true };

describe("gameweekStatus", () => {
  it("is final once FPL marks the event finished", () => {
    expect(gameweekStatus(event(5, { finished: true }), [], NOW)).toBe("final");
  });

  it("is provisional when every match has ended but bonus isn't confirmed", () => {
    expect(gameweekStatus(event(6), [fixture(6, done), fixture(6, done)], NOW)).toBe("provisional");
  });

  it("is live while any match is still to finish", () => {
    expect(gameweekStatus(event(6), [fixture(6, done), fixture(6, { started: true })], NOW)).toBe(
      "live",
    );
  });

  it("is live after the deadline even before a ball is kicked", () => {
    expect(gameweekStatus(event(6), [fixture(6)], NOW)).toBe("live");
  });

  it("is upcoming before the deadline", () => {
    const future = event(7, { deadline_time: "2026-10-17T10:00:00Z" });
    expect(gameweekStatus(future, [fixture(7)], NOW)).toBe("upcoming");
  });

  it("ignores other gameweeks' fixtures", () => {
    expect(gameweekStatus(event(6), [fixture(5, done), fixture(6)], NOW)).toBe("live");
  });
});

describe("latestUnlockedGameweek", () => {
  it("prefers the newest provisional gameweek over older final ones", () => {
    const events = [event(4, { finished: true }), event(5, { finished: true }), event(6)];
    expect(latestUnlockedGameweek(events, [fixture(6, done)], NOW)).toEqual({
      id: 6,
      status: "provisional",
    });
  });

  it("falls back to the last final gameweek while the current one is live", () => {
    const events = [event(5, { finished: true }), event(6)];
    expect(latestUnlockedGameweek(events, [fixture(6, { started: true })], NOW)).toEqual({
      id: 5,
      status: "final",
    });
  });

  it("returns null before any gameweek has finished", () => {
    expect(latestUnlockedGameweek([event(1)], [fixture(1)], NOW)).toBeNull();
  });
});
