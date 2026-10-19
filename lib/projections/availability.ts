import type { Element } from "@/lib/fpl/schemas";

// The chance a player is available in each gameweek of the window.
//
// - Next gameweek: FPL's own chance_of_playing_next_round, when it gives one.
// - Later gameweeks: the return date in FPL's news when there is one
//   ("Expected back 1 Nov", "Suspended until 31 Oct"); otherwise a gradual
//   recovery for the injured and suspended.
// - Players who left (loans, transfers out: statuses u and n) are out throughout.

/** Chance of being back for each week after the next when no return date is given. Index 0 is two gameweeks out. */
export const RECOVERY = [0.5, 0.75] as const;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const RETURN = /(?:expected back|until)\s+(\d{1,2})\s+([a-z]{3})/i;
const DAY = 24 * 60 * 60 * 1000;
/** A return on the day after a deadline still counts for that gameweek's matches. */
const MATCH_DAYS = DAY;

/** The return date in FPL's news (ms), or null. The year is the one that puts it after the news. */
export function returnDate(news: string | null, newsAdded: string | null): number | null {
  const match = news ? RETURN.exec(news) : null;
  const added = newsAdded ? Date.parse(newsAdded) : NaN;
  if (!match || Number.isNaN(added)) return null;
  const month = MONTHS.indexOf(match[2].toLowerCase());
  if (month < 0) return null;
  const year = new Date(added).getUTCFullYear();
  const date = Date.UTC(year, month, Number(match[1]));
  return date < added - 7 * DAY ? Date.UTC(year + 1, month, Number(match[1])) : date;
}

type Flags = Pick<Element, "status" | "news" | "news_added" | "chance_of_playing_next_round">;

/**
 * Availability for each gameweek in the window, given each one's deadline (ms).
 * The first deadline is the next gameweek's.
 */
export function availability(player: Flags, deadlines: readonly number[]): number[] {
  const { status, chance_of_playing_next_round: chance } = player;
  if (status === "u" || status === "n") return deadlines.map(() => 0);
  const back = returnDate(player.news, player.news_added);
  const flagged = status === "i" || status === "s";
  return deadlines.map((deadline, i) => {
    if (i === 0) return chance === null ? (flagged ? 0 : status === "d" ? 0.5 : 1) : chance / 100;
    if (back !== null) return back <= deadline + MATCH_DAYS ? 1 : 0;
    if (!flagged) return 1;
    return RECOVERY[i - 1] ?? 1;
  });
}
