import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const DIR = process.argv[2] ?? join(tmpdir(), "fsb-odds-calibration");
mkdirSync(DIR, { recursive: true });
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(join(DIR, "data.json")));
const boot = JSON.parse(readFileSync(join(DIR, "bootstrap.json")));
const avg = Object.fromEntries(boot.events.filter((e) => e.average_entry_score).map((e) => [e.id, e.average_entry_score]));
const SIGMA = 12.4, TAU = 4.8, END = 7, PAST_SLOPE = 0.24, PAST_MEAN = 52.3, NO_PAST = -3.8;
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const Phi = (z) => 0.5 * (1 + Math.tanh(0.7978845608 * (z + 0.044715 * z ** 3))); // normal CDF (tanh approx)
function state(h, k) {
  const rows = h.current.filter((c) => c.event <= k);
  const total = rows.reduce((s, c) => s + c.points - c.cost, 0);
  const res = rows.map((c) => c.points - c.cost - avg[c.event]);
  const moves = [...rows.filter((c) => c.transfers > 0).map((c) => c.event), ...h.chips.filter((c) => (c.name === "wildcard" || c.name === "freehit") && c.event <= k).map((c) => c.event)];
  const started = rows.length ? Math.min(...rows.map((c) => c.event)) : k;
  const idle = k - Math.max(started, ...moves, 0);
  const last = h.past.find((p) => p.season === "2025/26");
  const prior = last ? PAST_SLOPE * (last.total / 38 - PAST_MEAN) : NO_PAST;
  return { total, res, idle, prior };
}
function skill(s, variant) {
  const n = s.res.length, m = mean(s.res);
  const w = (TAU ** 2) / (TAU ** 2 + SIGMA ** 2 / Math.max(n, 1));
  const priorMean = variant.past ? s.prior : 0;
  let mu = variant.skill ? priorMean + w * (m - priorMean) : 0;
  if (variant.activity && s.idle >= 3) mu -= 2; // extra weekly decline for idle teams (to tune)
  return mu;
}
const variants = { "gap only": {}, "+ skill": { skill: 1 }, "+ last season": { skill: 1, past: 1 }, "+ activity": { skill: 1, past: 1, activity: 1 } };
for (const k of [3, 4, 5]) {
  const h = END - k;
  const out = {};
  for (const [name, v] of Object.entries(variants)) {
    let loss = 0, pairs = 0, leaderHit = 0, leaderBrier = 0, leagues = 0;
    for (const league of data.leagues) {
      const ms = league.members.map((m) => ({ id: m.entry, h: data.histories[m.entry] })).filter((m) => m.h && m.h.current.some((c) => c.event === END));
      if (ms.length < 4) continue;
      const st = ms.map((m) => ({ ...state(m.h, k), final: state(m.h, END).total }));
      const mus = st.map((s) => skill(s, v));
      for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) {
        if (st[i].final === st[j].final) continue;
        const p = Phi((st[i].total - st[j].total + (mus[i] - mus[j]) * h) / (Math.SQRT2 * SIGMA * Math.sqrt(h)));
        const y = st[i].final > st[j].final ? 1 : 0;
        const q = Math.min(1 - 1e-6, Math.max(1e-6, y ? p : 1 - p));
        loss -= Math.log(q); pairs++;
      }
      // Leader at END: Monte Carlo
      const SIMS = 4000; const wins = new Array(st.length).fill(0);
      for (let s = 0; s < SIMS; s++) {
        let best = -1e9, bi = 0;
        st.forEach((x, i) => { let t = x.total; for (let g = 0; g < h; g++) { let u = 0, w2 = 0; while (!u) u = Math.random(); while (!w2) w2 = Math.random(); t += mus[i] + SIGMA * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w2); } if (t > best) { best = t; bi = i; } });
        wins[bi]++;
      }
      const actual = st.reduce((b, x, i) => (x.final > st[b].final ? i : b), 0);
      const fav = wins.indexOf(Math.max(...wins));
      leaderHit += fav === actual ? 1 : 0;
      leaderBrier += wins.reduce((s, w, i) => s + (w / SIMS - (i === actual ? 1 : 0)) ** 2, 0);
      leagues++;
    }
    out[name] = `pair log-loss ${(loss / pairs).toFixed(4)} (${pairs} pairs) · favourite won ${leaderHit}/${leagues} · leader Brier ${(leaderBrier / leagues).toFixed(3)}`;
  }
  console.log(`\nFrom GW${k} → GW${END} (${END - k} GWs ahead)`); Object.entries(out).forEach(([n, s]) => console.log(`  ${n.padEnd(15)} ${s}`));
}
