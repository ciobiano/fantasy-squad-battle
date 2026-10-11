import { z } from "zod";

// Only the FPL fields the app uses. z.object strips everything else, which
// keeps cached payloads small. Names stay snake_case as FPL sends them;
// lib/league maps them to the app's own shapes.

const id = z.number().int().positive();

// Fields used only by the tools (injuries, stats, prices). If FPL changes or
// drops one, it becomes null with a one-time warning, so a tool shows a gap
// instead of the league pages failing. FPL sends many numbers as strings
// ("1.23"), so numbers are coerced.
const warned = new Set<string>();
function tolerant<T extends z.ZodType>(field: string, schema: T) {
  return schema.nullable().catch(() => {
    if (!warned.has(field)) {
      warned.add(field);
      console.warn(`[fpl] unexpected value for "${field}", using null`);
    }
    return null;
  });
}
const toolNumber = (field: string) => tolerant(field, z.coerce.number());
const toolText = (field: string) => tolerant(field, z.string());

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
  strength: toolNumber("team.strength"),
  strength_attack_home: toolNumber("team.strength_attack_home"),
  strength_attack_away: toolNumber("team.strength_attack_away"),
  strength_defence_home: toolNumber("team.strength_defence_home"),
  strength_defence_away: toolNumber("team.strength_defence_away"),
});

export const elementSchema = z.object({
  id,
  web_name: z.string(),
  first_name: z.string(),
  second_name: z.string(),
  team: id,
  element_type: z.number().int().min(1).max(5),
  // Injuries & bans
  status: toolText("status"),
  news: toolText("news"),
  news_added: toolText("news_added"),
  chance_of_playing_next_round: toolNumber("chance_of_playing_next_round"),
  // Stats
  now_cost: toolNumber("now_cost"),
  selected_by_percent: toolNumber("selected_by_percent"),
  form: toolNumber("form"),
  points_per_game: toolNumber("points_per_game"),
  total_points: toolNumber("total_points"),
  minutes: toolNumber("minutes"),
  starts: toolNumber("starts"),
  goals_scored: toolNumber("goals_scored"),
  assists: toolNumber("assists"),
  clean_sheets: toolNumber("clean_sheets"),
  expected_goals: toolNumber("expected_goals"),
  expected_assists: toolNumber("expected_assists"),
  expected_goal_involvements: toolNumber("expected_goal_involvements"),
  ict_index: toolNumber("ict_index"),
  defensive_contribution: toolNumber("defensive_contribution"),
  /** FPL's "expected points": in practice this is recent form (see CLAUDE.md). Never label it a projection. */
  ep_next: toolNumber("ep_next"),
  // Prices and transfers
  transfers_in_event: toolNumber("transfers_in_event"),
  transfers_out_event: toolNumber("transfers_out_event"),
  cost_change_event: toolNumber("cost_change_event"),
  price_change_projections: tolerant(
    "price_change_projections",
    z.array(
      z.object({
        offset: z.number().int(),
        projected_percent: z.coerce.number(),
        likelihood: z.number(),
      }),
    ),
  ),
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

/** A manager's team. Surnames are deliberately not read (cards use first names only). */
export const entrySchema = z.object({
  id,
  name: z.string(),
  player_first_name: z.string(),
  current_event: z.number().int().nullable(),
  last_deadline_bank: z.number().int().nullable(),
  last_deadline_value: z.number().int().nullable(),
  leagues: z.object({
    classic: z.array(
      z.object({
        id,
        name: z.string(),
        /** "x": made by players; "s": FPL's own (Overall, countries, clubs, gameweek leagues). */
        league_type: z.string(),
        /** Number of managers in the league; null for leagues that haven't started. */
        rank_count: z.number().int().nullable(),
        entry_rank: z.number().int().nullable(),
        entry_last_rank: z.number().int().nullable(),
      }),
    ),
  }),
});

/** One player's fixtures ahead and this season's gameweek history (player pages). */
export const playerSummarySchema = z.object({
  fixtures: z.array(
    z.object({
      id,
      event: z.number().int().nullable(),
      team_h: id,
      team_a: id,
      is_home: z.boolean(),
      difficulty: z.number().int().min(1).max(5),
      kickoff_time: z.string().nullable(),
      finished: z.boolean(),
    }),
  ),
  history: z.array(
    z.object({
      round: id,
      fixture: id,
      opponent_team: id,
      was_home: z.boolean(),
      total_points: z.number(),
      minutes: z.number(),
      starts: toolNumber("history.starts"),
      goals_scored: toolNumber("history.goals_scored"),
      assists: toolNumber("history.assists"),
      clean_sheets: toolNumber("history.clean_sheets"),
      bonus: toolNumber("history.bonus"),
      expected_goals: toolNumber("history.expected_goals"),
      expected_assists: toolNumber("history.expected_assists"),
      expected_goal_involvements: toolNumber("history.expected_goal_involvements"),
      defensive_contribution: toolNumber("history.defensive_contribution"),
      value: toolNumber("history.value"),
      selected: toolNumber("history.selected"),
    }),
  ),
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
export type Entry = z.infer<typeof entrySchema>;
export type PlayerSummary = z.infer<typeof playerSummarySchema>;

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
