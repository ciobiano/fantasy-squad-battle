import { describe, expect, it, vi } from "vitest";
import {
  bootstrapSchema,
  entrySchema,
  fixturesSchema,
  historySchema,
  picksSchema,
  transfersSchema,
  type Bootstrap,
  type Picks,
  type Standings,
} from "@/lib/fpl/schemas";
import rawBootstrap from "./__fixtures__/bootstrap.json";
import rawEntry from "./__fixtures__/entry.json";
import rawFixtures from "./__fixtures__/fixtures.json";
import rawHistory from "./__fixtures__/history.json";
import rawPicks from "./__fixtures__/picks.json";
import rawTransfers from "./__fixtures__/transfers.json";
import { rateSquad, replacementsFor, sellingPrice, simulatePlan, type Rules } from "./engine";
import { freeTransfersAfter, importSquad, pricesPaid, type ImportSource } from "./import";
import { contextOf, getPlanner, type PlannerSource } from "./index";
import { getLeaguePaper, paperLeagues, type PaperSource } from "./league";
import { priceTrend } from "./players";
import { RULES_2026_27, rulesOf } from "./rules";

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

// Real FPL data from 19 Oct 2026 (GW7 current, GW8 next) and one real
// manager's public squad, transfers and history, anonymised. They played
// Triple Captain in GW3 and a Wildcard in GW6.
const bootstrap = bootstrapSchema.parse(rawBootstrap);
const fixtures = fixturesSchema.parse(rawFixtures);
const entry = entrySchema.parse(rawEntry);
const history = historySchema.parse(rawHistory);
const picks = picksSchema.parse(rawPicks);
const transfers = transfersSchema.parse(rawTransfers);
const rules = rulesOf(bootstrap);
const id = (name: string) => bootstrap.elements.find((e) => e.web_name === name)!.id;
/** Chips in a fixed order, since FPL lists them its own way. */
const sorted = (r: Rules) => ({ ...r, chips: [...r.chips].sort((a, b) => a.chip.localeCompare(b.chip) || a.from - b.from) });

const squads = (overrides: Partial<ImportSource> = {}): ImportSource => ({
  entry: async (teamId) => (teamId === entry.id ? entry : null),
  history: async () => history,
  picks: async (_, gw) => (gw === 7 ? picks : null),
  transfers: async () => transfers,
  playerSummary: async () => null,
  ...overrides,
});
const planner = (overrides: Partial<ImportSource> = {}): PlannerSource => ({
  bootstrap: async () => bootstrap,
  fixtures: async () => fixtures,
  squads: squads(overrides),
});

describe("FPL's rules", () => {
  it("are read from bootstrap, and match 2026/27's", () => {
    expect(sorted(rules)).toEqual(sorted(RULES_2026_27));
  });

  it("fall back to 2026/27's when FPL stops sending them", () => {
    const bare: Bootstrap = { ...bootstrap, game_config: null, chips: null, element_types: null };
    expect(sorted(rulesOf(bare))).toEqual(sorted(RULES_2026_27));
  });

  it("follow FPL when it changes them", () => {
    const bigger: Bootstrap = { ...bootstrap, game_config: { ...bootstrap.game_config!, rules: { ...bootstrap.game_config!.rules, squad_total_spend: 1050, max_extra_free_transfers: 2 } } };
    expect(rulesOf(bigger)).toMatchObject({ budget: 1050, maxFreeTransfers: 3 });
  });
});

describe("importing a squad", () => {
  it("replays free transfers through the season", () => {
    // GW2 → 2 saved; GW3 two spent → 1; GW4 one → 1; GW5 two (a hit) → 1; GW6 Wildcard keeps 1; GW7 none → 2.
    expect(freeTransfersAfter(history, 1, 7, rules)).toBe(2);
    expect(freeTransfersAfter(history, 1, 2, rules)).toBe(2);
    expect(freeTransfersAfter(history, 7, 7, rules)).toBe(1);
  });

  it("prices each player at his last transfer in, or the start price", () => {
    const squad = picks.picks.map((p) => p.element);
    const fallback = new Map([[id("Raya"), 60]]);
    const paid = pricesPaid(squad, transfers, new Set(), fallback);
    expect(paid.get(id("Calafiori"))).toBe(59);
    expect(paid.get(id("Raya"))).toBe(60);
    // Bought at 5.9, now 6.0: sells for 5.9 (half of 0.1, rounded down).
    expect(sellingPrice(59, 60, rules.sellOnFee)).toBe(59);
  });

  it("ignores Free Hit transfers, which FPL reverses", () => {
    const freeHit = new Set([6]);
    expect(pricesPaid([id("Calafiori")], transfers, freeHit, new Map()).get(id("Calafiori"))).toBeUndefined();
  });

  it("starts the plan at the next deadline with the squad, bank, free transfers and chips used", async () => {
    const result = await importSquad(entry.id, bootstrap, rules, squads());
    if (result.kind !== "ready") throw new Error(result.kind);
    expect(result.asOf).toBe(7);
    expect(result.start).toMatchObject({ gw: 8, bank: 13, freeTransfers: 2, chipsUsed: [{ chip: "3xc", gw: 3 }, { chip: "wildcard", gw: 6 }] });
    expect(result.start.squad).toHaveLength(15);
    // Held since GW1, so priced at the season's start: 15.5.
    expect(result.start.squad.find((o) => o.id === id("Haaland"))!.bought).toBe(155);
    expect(result.guessedPrices).toEqual([]);
  });

  it("uses the squad from before a Free Hit", async () => {
    const before: Picks = { ...picks, picks: picks.picks.map((p, i) => (i === 14 ? { ...p, element: id("Saka") } : p)) };
    const source = squads({ picks: async (_, gw) => (gw === 7 ? { ...picks, active_chip: "freehit" } : gw === 6 ? before : null) });
    const result = await importSquad(entry.id, bootstrap, rules, source);
    if (result.kind !== "ready") throw new Error(result.kind);
    expect(result.asOf).toBe(6);
    expect(result.start.squad.map((o) => o.id)).toContain(id("Saka"));
  });

  it("says when the team doesn't exist or hasn't played yet", async () => {
    expect(await importSquad(42, bootstrap, rules, squads())).toEqual({ kind: "team-not-found" });
    const fresh = squads({ entry: async () => ({ ...entry, current_event: null }) });
    // FPL shows a new team's squad once the next deadline passes.
    expect(await importSquad(entry.id, bootstrap, rules, fresh)).toEqual({
      kind: "no-squad",
      team: { id: entry.id, name: "Test FC" },
      deadline: "2026-10-23T17:30:00Z",
    });
  });
});

describe("the planner bundle", () => {
  it("rates the squad and suggests transfers that keep to the rules", async () => {
    const outcome = await getPlanner(entry.id, 6, planner());
    if (outcome.kind !== "ready") throw new Error(outcome.kind);
    const { data } = outcome;
    expect(data.gws).toEqual([8, 9, 10, 11, 12, 13]);
    expect(data.deadline).toBe("2026-10-23T17:30:00Z");
    expect(data.team!.rating.perWeek).toHaveLength(6);
    expect(data.team!.rating.points).toBeGreaterThan(6 * 40);
    expect(data.team!.rating.points).toBeLessThan(6 * 90);
    const ctx = contextOf(data);
    for (const idea of [...data.team!.ideas.singles, ...data.team!.ideas.pairs]) {
      expect(idea.gain).toBeGreaterThan(0);
      expect(simulatePlan(data.team!.start, [{ gw: 8, transfers: idea.transfers }], ctx).valid).toBe(true);
    }
  });

  it("drafts from scratch without a team", async () => {
    const outcome = await getPlanner(null, 3, planner());
    if (outcome.kind !== "ready") throw new Error(outcome.kind);
    expect(outcome.data.team).toBeNull();
    expect(outcome.data.gws).toEqual([8, 9, 10]);
    // Every player in the snapshot who can still be picked (it leaves out those who haven't played).
    expect(outcome.data.players.length).toBe(bootstrap.elements.filter((e) => e.can_select !== false).length);
    expect(outcome.data.clubs).toHaveLength(20);
  });

  it("passes on an unknown team", async () => {
    expect(await getPlanner(42, 6, planner())).toEqual({ kind: "team-not-found" });
  });

  it("flags FPL's forecast price rises", () => {
    const deadlines = bootstrap.game_config!.settings.price_change_deadlines;
    expect(priceTrend(bootstrap.elements.find((e) => e.web_name === "Groß")!, deadlines)).toEqual({ direction: "rise", at: deadlines[0], likelihood: 5 });
    expect(priceTrend({ ...bootstrap.elements[0], price_change_projections: [{ offset: 1, projected_percent: -104, likelihood: -3 }] }, deadlines)).toEqual({
      direction: "fall",
      at: deadlines[1],
      likelihood: 3,
    });
    expect(priceTrend({ ...bootstrap.elements[0], price_change_projections: null }, deadlines)).toBeNull();
  });
});

describe("replacements on real data", () => {
  it("rank by team gain exactly as a full rating does, fast enough for a phone", async () => {
    const outcome = await getPlanner(entry.id, 6, planner());
    if (outcome.kind !== "ready") throw new Error(outcome.kind);
    const { data } = outcome;
    const ctx = contextOf(data);
    const state = data.team!.start;
    const ids = state.squad.map((o) => o.id);
    const base = rateSquad(ids, ctx).points;
    const started = performance.now();
    const lists = state.squad.map((o) => replacementsFor(state, o.id, ctx));
    const perPlayer = (performance.now() - started) / lists.length;
    // The slowest single list (a midfielder's, about 300 candidates) stays well inside a frame on this i3.
    expect(perPlayer).toBeLessThan(16);
    for (const [k, list] of lists.entries()) {
      const out = state.squad[k].id;
      for (const r of list.slice(0, 5)) {
        const swapped = ids.map((id) => (id === out ? r.id : id));
        expect(r.gain).toBeCloseTo(rateSquad(swapped, ctx).points - base, 1);
      }
    }
  });
});

describe("on paper", () => {
  const row = (entryId: number, rank: number, name: string): Standings["standings"]["results"][number] => ({
    entry: entryId,
    entry_name: `${name} FC`,
    player_name: `${name} Test`,
    rank,
    last_rank: rank,
    total: 400 - rank,
    event_total: 50,
  });
  const standings: Standings = { league: { id: 9, name: "Banter" }, standings: { has_next: false, page: 1, results: [row(1, 1, "ade"), row(2, 2, "BOLA"), row(3, 3, "Chi")] } };
  // Ade's squad swaps Haaland for a forward who hasn't played.
  const benchwarmer = bootstrap.elements.find((e) => e.element_type === 4 && (e.minutes ?? 0) === 0)!.id;
  const weaker: Picks = { ...picks, picks: picks.picks.map((p) => (p.element === id("Haaland") ? { ...p, element: benchwarmer } : p)) };
  const source = (overrides: Partial<PaperSource> = {}): PaperSource => ({
    bootstrap: async () => bootstrap,
    fixtures: async () => fixtures,
    standings: async (leagueId) => (leagueId === 9 ? standings : null),
    picks: async (entryId, gw) => (gw !== 7 ? null : entryId === 1 ? weaker : entryId === 2 ? picks : null),
    ...overrides,
  });

  it("ranks the league's squads by rating, with first names", async () => {
    const table = await getLeaguePaper(9, 6, source());
    if (table.kind !== "ready") throw new Error(table.kind);
    expect(table.asOf).toBe(7);
    // Chi has no squad yet; the full squad beats the one without Haaland.
    expect(table.rows.map((r) => [r.firstName, r.rank, r.leagueRank])).toEqual([["Bola", 1, 2], ["Ade", 2, 1]]);
    expect(table.rows[0].rating.points).toBeGreaterThan(table.rows[1].rating.points);
  });

  it("asks for final picks only once FPL marks the gameweek finished", async () => {
    const asked: [number, boolean][] = [];
    const spy = source({ picks: async (entryId, gw, final) => (asked.push([gw, final]), entryId === 2 && gw === 7 ? picks : null) });
    await getLeaguePaper(9, 6, spy);
    expect(asked.every(([gw, final]) => final === (bootstrap.events.find((e) => e.id === gw)?.finished ?? false))).toBe(true);
    const done: Bootstrap = { ...bootstrap, events: bootstrap.events.map((e) => (e.id === 7 ? { ...e, finished: true } : e)) };
    asked.length = 0;
    await getLeaguePaper(9, 6, { ...spy, bootstrap: async () => done });
    expect(asked.filter(([gw]) => gw === 7).every(([, final]) => final)).toBe(true);
  });

  it("lists the leagues a team can be ranked in", () => {
    const league = (id: number, members: number | null, rank: number | null, kind: "private" | "public" = "private") => ({ id, name: `L${id}`, kind, members, rank, lastRank: rank });
    const mine = [league(1, 11, 3), league(2, 1, 1), league(3, 900, 12), league(4, 900, 400), league(5, null, null), league(6, 9_000_000, 2_000_000, "public")];
    expect(paperLeagues(mine).map((l) => l.id)).toEqual([1, 3]);
  });

  it("passes on an unknown league or one with no squads", async () => {
    expect(await getLeaguePaper(10, 6, source())).toEqual({ kind: "league-not-found" });
    expect(await getLeaguePaper(9, 6, source({ picks: async () => null }))).toEqual({ kind: "no-squads" });
  });
});
