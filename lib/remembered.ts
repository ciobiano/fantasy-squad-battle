// What the phone remembers, with no accounts: the last team and league in
// cookies, the theme in localStorage. Pure, so it's safe in the proxy, the
// server and the browser; proxy.ts and lib/request.ts are the Next adapters.
import { isAwardKey } from "@/lib/awards";
import { SAMPLE_LEAGUE, fplId, gameweekNumber } from "@/lib/ids";

export const TEAM_COOKIE = "fsb-team";
export const LEAGUE_COOKIE = "fsb-league";
export const THEME_STORAGE_KEY = "fsb-theme";

/** A year, on this site only; sent on top-level navigation from links. */
export const REMEMBER_FOR = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" } as const;

const TEAM_PAGE = /^\/team\/([^/]+)$/;
const LEAGUE_PAGE = /^\/league\/([^/]+)(?:\/table|\/paper|\/story\/([^/]+))?$/;
/** A team's rating (/planner/{id}) and its plan (/planner/{id}/plan). */
const PLANNER_PAGE = /^\/planner\/([^/]+)(?:\/plan)?$/;
/** Planner pages that aren't a team: the draft from scratch and the Start form's target. */
const PLANNER_ROUTES: ReadonlySet<string> = new Set(["draft", "find"]);
const SHARE_PAGE = /^\/s\/([^/]+)\/([^/]+)$/;

/** Pages that carry an ID worth remembering. The sample league isn't one: it has no number. */
const REMEMBERS: readonly { readonly path: RegExp; readonly cookie: string }[] = [
  { path: TEAM_PAGE, cookie: TEAM_COOKIE },
  { path: PLANNER_PAGE, cookie: TEAM_COOKIE },
  { path: LEAGUE_PAGE, cookie: LEAGUE_COOKIE },
];

export type Visit =
  | { readonly kind: "redirect"; readonly to: string }
  /** No such page. Decided here, before rendering, so the status can still be 404: once a page streams, it's 200. */
  | { readonly kind: "not-found" }
  | { readonly kind: "continue"; readonly save: readonly { readonly name: string; readonly value: string }[] };

/**
 * What a visit means before the page renders:
 * - "/" opens the last league straight away, unless the link says ?start=1;
 *   "/planner" opens the last team's rating the same way;
 * - /league/{x}(/table, /paper, /story/{card}) is a 404 unless x is a league ID
 *   or the sample league, and the card is the Wrap or an award;
 * - /planner/{x}(/plan) is a 404 unless x is a team ID (or the draft);
 * - /s/{league}/{gw} is a 404 unless both are well formed;
 * - /team/{id}, /planner/{id} and /league/{id} pages save that ID.
 */
export function onVisit(pathname: string, search: URLSearchParams, saved: (cookie: string) => string | undefined): Visit {
  if (pathname === "/") {
    const league = fplId(saved(LEAGUE_COOKIE));
    return league !== null && !search.has("start") ? { kind: "redirect", to: `/league/${league}` } : { kind: "continue", save: [] };
  }
  if (pathname === "/planner") {
    const team = rememberedTeamId(saved);
    return team !== null && !search.has("start") ? { kind: "redirect", to: `/planner/${team}` } : { kind: "continue", save: [] };
  }
  const [, plannerTeam] = PLANNER_PAGE.exec(pathname) ?? [];
  if (plannerTeam !== undefined && !PLANNER_ROUTES.has(plannerTeam) && fplId(plannerTeam) === null) return { kind: "not-found" };
  const [, league, card] = LEAGUE_PAGE.exec(pathname) ?? [];
  if (league !== undefined && league !== SAMPLE_LEAGUE && fplId(league) === null) return { kind: "not-found" };
  if (card !== undefined && card !== "wrap" && !isAwardKey(card)) return { kind: "not-found" };
  const [, shareLeague, shareGw] = SHARE_PAGE.exec(pathname) ?? [];
  if (shareLeague !== undefined && ((shareLeague !== SAMPLE_LEAGUE && fplId(shareLeague) === null) || gameweekNumber(shareGw) === null)) {
    return { kind: "not-found" };
  }
  const save = REMEMBERS.flatMap(({ path, cookie }) => {
    const id = fplId(path.exec(pathname)?.[1]);
    return id === null ? [] : [{ name: cookie, value: String(id) }];
  });
  return { kind: "continue", save };
}

/** The remembered team, or null if there's none or it isn't a valid ID. */
export const rememberedTeamId = (saved: (cookie: string) => string | undefined): number | null => fplId(saved(TEAM_COOKIE));

/** Where the watched story circles of one league's gameweek are kept (localStorage). */
export const watchedKey = (leagueId: string, gw: number): string => `fsb-watched:${leagueId}:${gw}`;

/** The cards already watched, from what's stored; anything unreadable counts as none. */
export function readWatched(stored: string | null): ReadonlySet<string> {
  try {
    const list: unknown = JSON.parse(stored ?? "[]");
    return new Set(Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

/** What to store once a card has been seen. */
export const withWatched = (stored: string | null, card: string): string => JSON.stringify([...new Set([...readWatched(stored), card])]);

/** Runs before the page paints, so a saved Light or Dark choice never flashes the other theme. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
