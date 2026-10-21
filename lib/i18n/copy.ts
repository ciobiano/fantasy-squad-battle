// The shape every language's catalogue fills in (pcm.ts, en.ts, fr.ts), so a
// missing or extra line is a type error. Tab and view names stay English
// (League, Fixtures, Players; Market, Table) and aren't here.
import type { AwardKey } from "@/lib/awards";
import type { StartInputError } from "@/lib/fpl/start-input";

export type StartError = StartInputError | "team-not-found" | "league-not-found";

export interface Copy {
  /** The theme button's accessible name, for each current choice. */
  readonly theme: { readonly system: string; readonly light: string; readonly dark: string };
  readonly languageLabel: string;
  readonly down: { readonly title: string; readonly body: string; readonly retry: string };
  /** The 404 page. */
  readonly notFound: { readonly title: string; readonly body: string; readonly home: string };
  readonly start: {
    readonly headline: string;
    readonly modeLabel: string;
    readonly modeTeam: string;
    readonly modeLeague: string;
    readonly teamLabel: string;
    readonly leagueLabel: string;
    readonly placeholder: string;
    readonly teamButton: string;
    readonly leagueButton: string;
    readonly teamHelp: string;
    readonly leagueHelp: string;
    readonly teamHelpBody: string;
    readonly leagueHelpBody: string;
    readonly errors: Readonly<Record<StartError, string>>;
  };
  readonly picker: {
    readonly title: string;
    readonly yours: string;
    readonly public: string;
    readonly notYou: string;
    readonly noPrivate: string;
    readonly rank: (rank: string) => string;
    readonly up: string;
    readonly down: string;
    readonly same: string;
    readonly unranked: string;
  };
  readonly league: {
    readonly gameweek: (gw: number) => string;
    readonly afterGameweek: (gw: number) => string;
    readonly changeLeague: (name: string) => string;
    readonly viewLabel: string;
    readonly top50: string;
    readonly marketSoon: string;
    readonly seeTable: string;
    readonly storiesLabel: string;
    /** The first story circle, which plays every card. */
    readonly wrapped: string;
    readonly storyGw: (gw: number) => string;
    readonly teamOfTheWeek: string;
    readonly owners: string;
    readonly marketHeading: string;
    readonly gwScore: string;
    /** Screen-reader words for a Market row's rank pill. */
    readonly moved: { readonly up: (places: number) => string; readonly down: (places: number) => string; readonly same: string };
    readonly columns: { readonly pos: string; readonly manager: string; readonly gw: string; readonly total: string };
    readonly standingsCaption: (gw: number) => string;
    readonly you: string;
    readonly sample: string;
  };
  readonly fixtures: {
    readonly title: string;
    readonly sortLabel: string;
    readonly easiest: string;
    readonly az: string;
    readonly legendStart: string;
    readonly legendEnd: string;
    readonly tableLabel: (first: number, last: number) => string;
    readonly teamColumn: string;
    /** The short column header, e.g. "GW6". */
    readonly column: (gw: number) => string;
    readonly week: (gw: number) => string;
    readonly match: (opponent: string, home: boolean, difficulty: number) => string;
    readonly noMatch: string;
    readonly home: string;
    readonly away: string;
    readonly runLabel: (run: number) => string;
  };
  readonly players: {
    readonly title: string;
    readonly section: string;
    readonly filterLabel: string;
    readonly all: string;
    readonly injured: string;
    readonly doubtful: string;
    readonly suspended: string;
    readonly unavailable: string;
    readonly allTeams: string;
    readonly empty: string;
    readonly ago: (age: string) => string;
  };
  /** The story viewer and its share sheet. */
  readonly story: {
    readonly label: (gw: number) => string;
    readonly position: (n: number, total: number) => string;
    readonly close: string;
    readonly previous: string;
    readonly next: string;
    readonly share: string;
    readonly pause: string;
    readonly play: string;
    readonly sheetTitle: (title: string) => string;
    readonly status: string;
    readonly statusSub: string;
    readonly x: string;
    readonly xSub: string;
    readonly save: string;
    readonly saveSub: string;
    readonly cancel: string;
    /** The picture arrived after the tap went stale (phones only share inside a tap). */
    readonly tapAgain: string;
    readonly failed: string;
    /** Saved instead of shared, where the browser can't share pictures (computers). */
    readonly saved: string;
    readonly savedForX: string;
  };
  /** The public share page and its link preview. */
  readonly sharePage: {
    readonly makeYourOwn: string;
    readonly awards: string;
    readonly disclaimer: string;
    readonly cta: string;
    readonly ctaSub: string;
    readonly metaTitle: (league: string, gw: number) => string;
    readonly metaDescription: string;
  };
  /** Award titles, on the cards and for the story circles. */
  readonly awards: Readonly<Record<AwardKey, string>>;
  /** One-word award names under the story circles. */
  readonly awardsShort: Readonly<Record<AwardKey, string>>;
  /** Words on the share cards. */
  readonly card: {
    readonly gw: (gw: number) => string;
    readonly wrapTitle: (gw: number) => string;
    readonly provisional: string;
    readonly leagueAverage: string;
    readonly onBench: string;
    readonly inHits: string;
    readonly inWeeks: (weeks: number) => string;
    readonly placesEach: string;
    readonly above: (points: number) => string;
    readonly below: (points: number) => string;
    readonly captain: (name: string) => string;
    readonly best: (name: string) => string;
    readonly topThisWeek: (name: string) => string;
    readonly kept: string;
    readonly paid: string;
    readonly others: (count: number) => string;
  };
  /** The Planner tab: Start, your team's rating, and (later) the plan. */
  readonly planner: {
    readonly title: string;
    readonly tagline: string;
    readonly rateButton: string;
    readonly or: string;
    readonly scratch: string;
    readonly scratchSub: string;
    readonly asOf: (gw: number) => string;
    readonly gw: (gw: number) => string;
    readonly window: (first: number, last: number) => string;
    readonly ratingHeading: string;
    readonly ptsProjected: string;
    readonly ratingNote: string;
    /** "2nd of 11", then "on paper" beside it. */
    readonly paperRank: (rank: number, of: number) => string;
    readonly onPaper: string;
    readonly paperAria: (rank: number, of: number, league: string) => string;
    readonly weekByWeek: string;
    readonly weekAria: (gw: number, points: string) => string;
    readonly whereFrom: string;
    readonly parts: { readonly GK: string; readonly DEF: string; readonly MID: string; readonly FWD: string; readonly captain: string };
    readonly ideas: string;
    readonly ideasAside: (first: number, last: number) => string;
    readonly freeTransfer: string;
    readonly twoTransfers: string;
    readonly hitCounted: (hit: number) => string;
    readonly left: (money: string) => string;
    readonly moveAria: (out: string, into: string) => string;
    readonly gainAria: (points: string) => string;
    readonly planButton: string;
    readonly changeTeam: string;
    readonly noSquadTitle: string;
    readonly noSquadBody: string;
    readonly loading: string;
  };
}
