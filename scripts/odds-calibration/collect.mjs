// Calibration study for title odds (lib/league/odds/model.ts). Run in order:
//   node scripts/odds-calibration/collect.mjs [dir]   public histories from friend leagues (IDs and numbers only)
//   node scripts/odds-calibration/analyse.mjs [dir]   weekly luck, skill spread, last-season weight, quitting
//   node scripts/odds-calibration/backtest.mjs [dir]  predicts GW END standings from earlier gameweeks
//   node scripts/odds-calibration/sweep.mjs [dir]     parameter sweep and calibration buckets
// Needs Node 22+ (fetch). Set GW and END to the latest finished gameweek before re-running.
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const DIR = process.argv[2] ?? join(tmpdir(), "fsb-odds-calibration");
mkdirSync(DIR, { recursive: true });
// Collects public season histories from friend-sized mini-leagues for calibrating title odds.
// Keeps only IDs and numbers. Polite: 3 requests at a time with a short pause.
import { writeFileSync } from "node:fs";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
const api = async (path) => {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`https://fantasy.premierleague.com/api/${path}`, { headers: { "User-Agent": UA, Accept: "application/json", Referer: "https://fantasy.premierleague.com/" } });
    if (r.ok) return r.json();
    if (r.status === 404) return null;
    await new Promise((s) => setTimeout(s, 1000 * (i + 1)));
  }
  return null;
};
const pool = async (items, n, fn) => { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); await new Promise((s) => setTimeout(s, 120)); } })); return out; };

const SEED = 1261677, MAX_LEAGUES = 45;
const seed = await api(`leagues-classic/${SEED}/standings/`);
const leagues = new Map([[SEED, seed]]);
const entries = await pool(seed.standings.results.map((r) => r.entry), 3, (id) => api(`entry/${id}/`));
const candidates = [...new Set(entries.flatMap((e) => (e?.leagues.classic ?? []).filter((l) => l.league_type === "x" && l.rank_count >= 6 && l.rank_count <= 50).map((l) => l.id)))].filter((id) => id !== SEED).slice(0, MAX_LEAGUES - 1);
const more = await pool(candidates, 3, (id) => api(`leagues-classic/${id}/standings/`));
candidates.forEach((id, i) => more[i] && leagues.set(id, more[i]));
const managerIds = [...new Set([...leagues.values()].flatMap((l) => l.standings.results.map((r) => r.entry)))];
console.log("leagues", leagues.size, "managers", managerIds.length);
const histories = await pool(managerIds, 3, (id) => api(`entry/${id}/history/`));
const data = {
  leagues: [...leagues.entries()].map(([id, l]) => ({ id, members: l.standings.results.map((r) => ({ entry: r.entry, rank: r.rank, total: r.total })) })),
  histories: Object.fromEntries(managerIds.map((id, i) => [id, histories[i] && {
    current: histories[i].current.map((c) => ({ event: c.event, points: c.points, cost: c.event_transfers_cost, transfers: c.event_transfers, bench: c.points_on_bench, total: c.total_points })),
    chips: histories[i].chips.map((c) => ({ name: c.name, event: c.event })),
    past: histories[i].past.map((p) => ({ season: p.season_name, total: p.total_points, rank: p.rank })),
  }])),
};
writeFileSync(join(DIR, "data.json"), JSON.stringify(data));
writeFileSync(join(DIR, "bootstrap.json"), JSON.stringify({ events: (await api("bootstrap-static/")).events.map((e) => ({ id: e.id, average_entry_score: e.average_entry_score })) }));
console.log("saved", Object.values(data.histories).filter(Boolean).length, "histories");
