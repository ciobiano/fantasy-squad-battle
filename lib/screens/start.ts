// The Start flow: what Start shows (from its query), where its form goes
// (/find), and the link back to Start with a reason, used by every screen that
// can't find what it was given.
import { cardUrl } from "@/lib/cards/request";
import { SAMPLE_GW } from "@/lib/cards/sample";
import { parseStartInput, type StartMode } from "@/lib/fpl/start-input";
import { START_ERRORS, type Lang, type StartError } from "@/lib/i18n";
import { SAMPLE_LEAGUE } from "@/lib/ids";

/** Query values as Next gives them: a repeated key arrives as an array. */
export type Query = Readonly<Record<string, string | readonly string[] | undefined>>;

export interface StartView {
  readonly mode: StartMode;
  /** What was typed, kept so a mistake can be fixed rather than retyped. */
  readonly value: string;
  readonly error: StartError | null;
  /** Two sample cards above the headline (Oga and the Wooden Spoon), square and dark. */
  readonly previews: readonly string[];
}

const MAX_TYPED = 300;

const one = (query: Query, key: string): string => {
  const value = query[key];
  return (typeof value === "string" ? value : value?.[0]) ?? "";
};

const modeOf = (query: Query): StartMode => (one(query, "mode") === "league" ? "league" : "team");

/** Start again, showing what was typed and why it didn't work. */
export function startHref(mode: StartMode, typed: string, error: StartError): string {
  return `/?${new URLSearchParams({ start: "1", mode, q: typed.slice(0, MAX_TYPED), error })}`;
}

/** Start's own query (?mode, ?q, ?error); unknown values fall back to the defaults. */
export function startView(query: Query, lang: Lang): StartView {
  const error = START_ERRORS.find((e) => e === one(query, "error")) ?? null;
  const previews = (["oga", "spoon"] as const).map((key) =>
    cardUrl(SAMPLE_LEAGUE, SAMPLE_GW, key, { format: "x", theme: "dark", lang, preview: true }),
  );
  return { mode: modeOf(query), value: one(query, "q").slice(0, MAX_TYPED), error, previews };
}

/** Where the Start form goes: a team to its league picker, a league to its page, anything else back to Start. */
export function findDestination(query: Query): string {
  const mode = modeOf(query);
  const typed = one(query, "q").slice(0, MAX_TYPED);
  const input = parseStartInput(typed, mode);
  if (!input.ok) return startHref(mode, typed, input.error);
  return input.kind === "team" ? `/team/${input.teamId}` : `/league/${input.leagueId}`;
}
