import { cacheLife, cacheTag } from "next/cache";
import type { z } from "zod";
import { FplHttpError, fplFetch } from "./http";
import {
  type Bootstrap,
  type DreamTeam,
  type Fixture,
  type History,
  type Live,
  type Picks,
  type Standings,
  bootstrapSchema,
  dreamTeamSchema,
  fixturesSchema,
  historySchema,
  liveSchema,
  parseFpl,
  picksSchema,
  standingsSchema,
} from "./schemas";

// Typed, validated FPL reads. Each is cached in Vercel's shared Runtime Cache
// ('use cache: remote'), so one fetch serves every league and every visitor.
// `final` (the gameweek is confirmed) is part of each cache key: provisional
// data refreshes every 5 minutes, and final data is kept for good.
//
// Errors thrown inside a 'use cache' function lose their class and fields in
// production (Next serialises them), so callers can't tell a 404 from an
// outage. Expected outcomes are therefore returned as null, never thrown.

/** Provisional data refreshes every 5 minutes; a final gameweek never changes. */
function cacheGameweek(final: boolean): void {
  if (final) cacheLife("max");
  else cacheLife("provisional");
}

async function read<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  return parseFpl(schema, await fplFetch(path, { init: { cache: "no-store" } }), path);
}

/** Like read, but a 404 (no such league, or no picks that gameweek) is null. */
async function readOrNull<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    return await read(path, schema);
  } catch (error) {
    if (error instanceof FplHttpError && error.status === 404) return null;
    throw error;
  }
}

export async function getBootstrap(): Promise<Bootstrap> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("fpl:bootstrap");
  return read("bootstrap-static/", bootstrapSchema);
}

export async function getFixtures(): Promise<readonly Fixture[]> {
  "use cache: remote";
  cacheLife("provisional");
  cacheTag("fpl:fixtures");
  return read("fixtures/", fixturesSchema);
}

/** First page only (the app covers the top 50 managers). null: no such league. */
export async function getStandings(leagueId: number): Promise<Standings | null> {
  "use cache: remote";
  cacheLife("provisional");
  cacheTag(`fpl:league:${leagueId}`);
  return readOrNull(`leagues-classic/${leagueId}/standings/`, standingsSchema);
}

/** Season history up to and including `gw`, so a final gameweek's view never changes. */
export async function getHistory(entryId: number, gw: number, final: boolean): Promise<History> {
  "use cache: remote";
  cacheGameweek(final);
  cacheTag(`fpl:entry:${entryId}`);
  const history = await read(`entry/${entryId}/history/`, historySchema);
  return {
    current: history.current.filter((row) => row.event <= gw),
    chips: history.chips.filter((chip) => chip.event <= gw),
  };
}

/** null: the manager hadn't started playing FPL by this gameweek. */
export async function getPicks(entryId: number, gw: number, final: boolean): Promise<Picks | null> {
  "use cache: remote";
  cacheGameweek(final);
  cacheTag(`fpl:entry:${entryId}`);
  return readOrNull(`entry/${entryId}/event/${gw}/picks/`, picksSchema);
}

export async function getLive(gw: number, final: boolean): Promise<Live> {
  "use cache: remote";
  cacheGameweek(final);
  cacheTag(`fpl:gw:${gw}`);
  return read(`event/${gw}/live/`, liveSchema);
}

export async function getDreamTeam(gw: number, final: boolean): Promise<DreamTeam> {
  "use cache: remote";
  cacheGameweek(final);
  cacheTag(`fpl:gw:${gw}`);
  return read(`dream-team/${gw}/`, dreamTeamSchema);
}
