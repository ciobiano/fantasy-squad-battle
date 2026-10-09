import type { Event, Fixture } from "./schemas";

// Where a gameweek is in its life. Cards unlock at "provisional" (every match
// has ended) and lose their "provisional" tag at "final" (FPL has confirmed
// bonus points). The status also decides how long FPL data may be cached.
export type GameweekStatus = "upcoming" | "live" | "provisional" | "final";

export const isUnlocked = (status: GameweekStatus) =>
  status === "provisional" || status === "final";

export function gameweekStatus(event: Event, fixtures: readonly Fixture[], now: number): GameweekStatus {
  if (event.finished) return "final";
  const matches = fixtures.filter((fixture) => fixture.event === event.id);
  if (matches.length > 0 && matches.every((fixture) => fixture.finished_provisional)) {
    return "provisional";
  }
  const started =
    Date.parse(event.deadline_time) <= now || matches.some((fixture) => fixture.started);
  return started ? "live" : "upcoming";
}

/** The newest gameweek whose cards are unlocked, or null before the season's first one. */
export function latestUnlockedGameweek(
  events: readonly Event[],
  fixtures: readonly Fixture[],
  now: number,
): { readonly id: number; readonly status: GameweekStatus } | null {
  const newestFirst = [...events].sort((a, b) => b.id - a.id);
  for (const event of newestFirst) {
    const status = gameweekStatus(event, fixtures, now);
    if (isUnlocked(status)) return { id: event.id, status };
  }
  return null;
}
