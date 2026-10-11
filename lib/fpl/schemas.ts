import { z } from "zod";

// Only the FPL fields the app uses. z.object strips everything else, which
// keeps cached payloads small. Names stay snake_case as FPL sends them;
// lib/league maps them to the app's own shapes.

const id = z.number().int().positive();

export const eventSchema = z.object({
  id,
  name: z.string(),
  deadline_time: z.string(),
  average_entry_score: z.number(),
  finished: z.boolean(),
  data_checked: z.boolean(),
  is_previous: z.boolean(),
  is_current: z.boolean(),
  is_next: z.boolean(),
});

export const teamSchema = z.object({
  id,
  name: z.string(),
  short_name: z.string(),
});

export const elementSchema = z.object({
  id,
  web_name: z.string(),
  first_name: z.string(),
  second_name: z.string(),
  team: id,
  element_type: z.number().int().min(1).max(5),
});

export const bootstrapSchema = z.object({
  events: z.array(eventSchema),
  teams: z.array(teamSchema),
  elements: z.array(elementSchema),
});

export const fixtureSchema = z.object({
  id,
  event: z.number().int().nullable(),
  kickoff_time: z.string().nullable(),
  started: z.boolean().nullable(),
  finished: z.boolean(),
  finished_provisional: z.boolean(),
  team_h: id,
  team_a: id,
});

export const fixturesSchema = z.array(fixtureSchema);

export const standingsSchema = z.object({
  league: z.object({ id, name: z.string() }),
  standings: z.object({
    has_next: z.boolean(),
    page: z.number().int(),
    results: z.array(
      z.object({
        entry: id,
        entry_name: z.string(),
        player_name: z.string(),
        rank: z.number().int(),
        last_rank: z.number().int(),
        total: z.number(),
        event_total: z.number(),
      }),
    ),
  }),
});

export const historySchema = z.object({
  current: z.array(
    z.object({
      event: id,
      points: z.number(),
      total_points: z.number(),
      event_transfers: z.number().int(),
      event_transfers_cost: z.number().int(),
      points_on_bench: z.number(),
    }),
  ),
  chips: z.array(z.object({ name: z.string(), event: id })),
});

export const picksSchema = z.object({
  active_chip: z.string().nullable(),
  automatic_subs: z.array(z.object({ element_in: id, element_out: id })),
  entry_history: z.object({
    event: id,
    points: z.number(),
    total_points: z.number(),
    event_transfers_cost: z.number().int(),
    points_on_bench: z.number(),
  }),
  picks: z.array(
    z.object({
      element: id,
      position: z.number().int().min(1).max(15),
      multiplier: z.number().int().min(0).max(3),
      is_captain: z.boolean(),
      is_vice_captain: z.boolean(),
    }),
  ),
});

export const liveSchema = z.object({
  elements: z.array(
    z.object({
      id,
      stats: z.object({ total_points: z.number(), minutes: z.number() }),
    }),
  ),
});

export const dreamTeamSchema = z.object({
  top_player: z.object({ id, points: z.number() }).nullable(),
  team: z.array(z.object({ element: id, points: z.number(), position: z.number().int() })),
});

export type Event = z.infer<typeof eventSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Element = z.infer<typeof elementSchema>;
export type Bootstrap = z.infer<typeof bootstrapSchema>;
export type Fixture = z.infer<typeof fixtureSchema>;
export type Standings = z.infer<typeof standingsSchema>;
export type History = z.infer<typeof historySchema>;
export type Picks = z.infer<typeof picksSchema>;
export type Live = z.infer<typeof liveSchema>;
export type DreamTeam = z.infer<typeof dreamTeamSchema>;

export class FplSchemaError extends Error {
  constructor(
    readonly path: string,
    readonly issues: string,
  ) {
    super(`FPL ${path} returned an unexpected shape: ${issues}`);
    this.name = "FplSchemaError";
  }
}

/** Validates an FPL response, failing loudly when FPL changes its data. */
export function parseFpl<T>(schema: z.ZodType<T>, data: unknown, path: string): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new FplSchemaError(path, z.prettifyError(result.error));
  return result.data;
}
