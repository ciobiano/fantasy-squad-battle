// The planner's rules engine: pure functions over plain data, safe to run in
// the browser. Screens get the data from lib/planner (getPlanner) and hand it
// to these functions; nothing here fetches.

export { bestLineup, withRoles } from "./lineup";
export { rankSquads, rateSquad, type SquadRating } from "./rating";
export { chipAvailable, chipsLeft, clubIssues, formationAllowed, POSITION_ORDER, sellingPrice, squadValue } from "./rules";
export { pointsIn, simulatePlan, type Context } from "./simulate";
export { suggestPairs, suggestTransfers, type TransferIdea } from "./suggest";
export type * from "./types";
