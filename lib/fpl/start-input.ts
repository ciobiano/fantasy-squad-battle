// Turns whatever someone types or pastes on the Start screen into a team ID
// or a classic league ID, or a reason we can't use it.
//
// FPL's team and league IDs overlap, so a bare number needs the mode the
// person picked ("My team ID" or "League"). Links are unambiguous:
// /entry/{id}/... is a team and /leagues/{id}/standings/c is a league,
// whichever mode is selected.

export type StartMode = "team" | "league";

export type StartInputError =
  | "empty"
  | "not-a-team"
  | "not-a-league"
  | "head-to-head"
  | "draft"
  | "invite-code";

export type StartInput =
  | { readonly ok: true; readonly kind: "team"; readonly teamId: number }
  | { readonly ok: true; readonly kind: "league"; readonly leagueId: number };

export type StartInputResult = StartInput | { readonly ok: false; readonly error: StartInputError };

export type LeagueInputResult =
  | { readonly ok: true; readonly leagueId: number }
  | { readonly ok: false; readonly error: StartInputError };

const ID = /^\d{1,10}$/;
const STANDINGS_PATH = /^\/leagues\/(\d{1,10})\/standings\/([ch])\/?$/;
const ENTRY_PATH = /^\/entry\/(\d{1,10})(?:\/|$)/;
const INVITE_PATH = /^\/leagues\/auto-join\//;

const fail = (error: StartInputError) => ({ ok: false, error }) as const;
const notFound = (mode: StartMode) => fail(mode === "team" ? "not-a-team" : "not-a-league");

function toId(digits: string): number | null {
  const id = Number(digits);
  return id > 0 ? id : null;
}

function asTeam(digits: string, mode: StartMode): StartInputResult {
  const teamId = toId(digits);
  return teamId ? { ok: true, kind: "team", teamId } : notFound(mode);
}

function asLeague(digits: string, mode: StartMode): StartInputResult {
  const leagueId = toId(digits);
  return leagueId ? { ok: true, kind: "league", leagueId } : notFound(mode);
}

function toUrl(text: string): URL | null {
  try {
    return new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
}

function fromUrl(url: URL, mode: StartMode): StartInputResult {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "draft.premierleague.com") return fail("draft");
  if (host !== "fantasy.premierleague.com") return notFound(mode);
  if (INVITE_PATH.test(url.pathname)) return fail("invite-code");

  const entry = ENTRY_PATH.exec(url.pathname);
  if (entry) return asTeam(entry[1], mode);
  const league = STANDINGS_PATH.exec(url.pathname);
  if (league) return league[2] === "h" ? fail("head-to-head") : asLeague(league[1], mode);
  return notFound(mode);
}

export function parseStartInput(raw: string, mode: StartMode): StartInputResult {
  const text = raw.trim();
  if (!text) return fail("empty");
  if (ID.test(text)) return mode === "team" ? asTeam(text, mode) : asLeague(text, mode);
  const url = toUrl(text);
  return url ? fromUrl(url, mode) : notFound(mode);
}

/** League-only parsing, for places that can only take a league (a team link is refused). */
export function parseLeagueInput(raw: string): LeagueInputResult {
  const result = parseStartInput(raw, "league");
  if (!result.ok) return result;
  return result.kind === "league" ? { ok: true, leagueId: result.leagueId } : fail("not-a-league");
}
