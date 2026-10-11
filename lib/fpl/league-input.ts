// Turns whatever a user pastes (an ID, a league URL, an invite link) into a
// classic league ID, or a reason we can't use it.

export type LeagueInputError =
  | "empty"
  | "not-a-league"
  | "head-to-head"
  | "draft"
  | "invite-code";

export type LeagueInputResult =
  | { readonly ok: true; readonly leagueId: number }
  | { readonly ok: false; readonly error: LeagueInputError };

const LEAGUE_ID = /^\d{1,10}$/;
const STANDINGS_PATH = /^\/leagues\/(\d{1,10})\/standings\/([ch])\/?$/;
const INVITE_PATH = /^\/leagues\/auto-join\//;

const fail = (error: LeagueInputError): LeagueInputResult => ({ ok: false, error });

function toLeagueId(digits: string): LeagueInputResult {
  const leagueId = Number(digits);
  return leagueId > 0 ? { ok: true, leagueId } : fail("not-a-league");
}

function toUrl(text: string): URL | null {
  try {
    return new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
}

export function parseLeagueInput(raw: string): LeagueInputResult {
  const text = raw.trim();
  if (!text) return fail("empty");
  if (LEAGUE_ID.test(text)) return toLeagueId(text);

  const url = toUrl(text);
  if (!url) return fail("not-a-league");

  const host = url.hostname.replace(/^www\./, "");
  if (host === "draft.premierleague.com") return fail("draft");
  if (host !== "fantasy.premierleague.com") return fail("not-a-league");
  if (INVITE_PATH.test(url.pathname)) return fail("invite-code");

  const match = STANDINGS_PATH.exec(url.pathname);
  if (!match) return fail("not-a-league");
  return match[2] === "h" ? fail("head-to-head") : toLeagueId(match[1]);
}
