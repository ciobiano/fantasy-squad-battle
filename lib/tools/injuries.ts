import { getBootstrap } from "@/lib/fpl/api";
import type { Bootstrap } from "@/lib/fpl/schemas";
import type { InjuryReport, InjuryRow, InjuryStatus } from "./types";

// Injuries & bans: every player FPL flags, newest news first. Built per
// request from the cached bootstrap.

/** FPL's status codes. "a" (available) isn't flagged; "n" (not eligible, e.g. against a parent club) reads as unavailable. */
const STATUS: ReadonlyMap<string, InjuryStatus> = new Map([
  ["i", "injured"],
  ["d", "doubtful"],
  ["s", "suspended"],
  ["u", "unavailable"],
  ["n", "unavailable"],
]);

const POSITION: ReadonlyMap<number, InjuryRow["position"]> = new Map([
  [1, "GK"],
  [2, "DEF"],
  [3, "MID"],
  [4, "FWD"],
]);

const CHANCES: ReadonlySet<number> = new Set([0, 25, 50, 75, 100]);

const reported = (row: InjuryRow) => Date.parse(row.reportedAt) || 0;

export function buildInjuryReport(bootstrap: Bootstrap, now: number): InjuryReport {
  const clubs = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const rows = bootstrap.elements.flatMap((e): InjuryRow[] => {
    const status = e.status === null ? undefined : STATUS.get(e.status);
    const position = POSITION.get(e.element_type);
    if (!status || !position) return [];
    const chance = e.chance_of_playing_next_round;
    return [
      {
        player: e.web_name,
        team: clubs.get(e.team) ?? "",
        position,
        status,
        chance: chance !== null && CHANCES.has(chance) ? (chance as InjuryRow["chance"]) : null,
        news: e.news ?? "",
        reportedAt: e.news_added ?? "",
      },
    ];
  });
  return {
    rows: rows.sort((a, b) => reported(b) - reported(a) || a.player.localeCompare(b.player)),
    clubs: [...clubs.values()].sort(),
    asOf: now,
  };
}

/** The report from live FPL data. Throws when FPL can't be read (the screen shows its outage panel). */
export async function getInjuryReport(now: number): Promise<InjuryReport> {
  return buildInjuryReport(await getBootstrap(), now);
}
