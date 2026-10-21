import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const DIR = process.argv[2] ?? join(tmpdir(), "fsb-odds-calibration");
mkdirSync(DIR, { recursive: true });
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(join(DIR, "data.json")));
const boot = JSON.parse(readFileSync(join(DIR, "bootstrap.json")));
const avg = Object.fromEntries(boot.events.filter((e) => e.average_entry_score).map((e) => [e.id, e.average_entry_score]));
const GW = 7;
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a) => Math.sqrt(a.reduce((s, x) => s + (x - mean(a)) ** 2, 0) / (a.length - 1));
const corr = (a, b) => { const ma = mean(a), mb = mean(b); let s = 0, sa = 0, sb = 0; a.forEach((x, i) => { s += (x - ma) * (b[i] - mb); sa += (x - ma) ** 2; sb += (b[i] - mb) ** 2; }); return s / Math.sqrt(sa * sb); };
const managers = Object.entries(data.histories).filter(([, h]) => h && h.current.length).map(([id, h]) => {
  const res = h.current.filter((c) => avg[c.event] !== undefined).map((c) => ({ event: c.event, r: c.points - c.cost - avg[c.event] }));
  const moves = new Set([...h.current.filter((c) => c.transfers > 0).map((c) => c.event), ...h.chips.filter((c) => c.name === "wildcard" || c.name === "freehit").map((c) => c.event)]);
  const lastMove = Math.max(0, ...moves);
  const started = Math.min(...h.current.map((c) => c.event));
  const last = h.past.find((p) => p.season === "2025/26");
  return { id: Number(id), res, started, lastMove, idle: GW - Math.max(lastMove, started), last, chips: h.chips, bench: h.current.map((c) => c.bench) };
});
console.log("GW averages", avg);
// 1. Weekly luck: within-manager sd of residuals (full-season managers only).
const full = managers.filter((m) => m.started === 1 && m.res.length === GW);
const withinVar = mean(full.map((m) => sd(m.res.map((x) => x.r)) ** 2));
const sigma = Math.sqrt(withinVar);
// 2. Skill spread: var of mean residual minus the luck share.
const means = full.map((m) => mean(m.res.map((x) => x.r)));
const tau2 = sd(means) ** 2 - withinVar / GW;
console.log(`managers ${managers.length}, full-season ${full.length}`);
console.log(`sigma (weekly luck) ${sigma.toFixed(1)}  | sd of 7-GW mean residual ${sd(means).toFixed(2)}  | tau (skill sd) ${tau2 > 0 ? Math.sqrt(tau2).toFixed(2) : "n/a"}  | mean residual ${mean(means).toFixed(2)}`);
// Split-half reliability: GW1-3 mean vs GW4-7 mean.
const a = full.map((m) => mean(m.res.slice(0, 3).map((x) => x.r))), b = full.map((m) => mean(m.res.slice(3).map((x) => x.r)));
console.log(`split-half corr (GW1-3 vs GW4-7) ${corr(a, b).toFixed(2)}`);
// 3. Last season as a prior.
const withPast = full.filter((m) => m.last);
const pastPerGw = withPast.map((m) => m.last.total / 38);
console.log(`with 2025/26 history: ${withPast.length}/${full.length}; corr(last season pts/GW, this season mean residual) ${corr(pastPerGw, withPast.map((m) => mean(m.res.map((x) => x.r)))).toFixed(2)}`);
const slope = (x, y) => { const mx = mean(x), my = mean(y); let s = 0, q = 0; x.forEach((v, i) => { s += (v - mx) * (y[i] - my); q += (v - mx) ** 2; }); return s / q; };
console.log(`slope residual per (last season pt/GW) ${slope(pastPerGw, withPast.map((m) => mean(m.res.map((x) => x.r)))).toFixed(2)}; last season pts/GW mean ${mean(pastPerGw).toFixed(1)} sd ${sd(pastPerGw).toFixed(1)}`);
// Past rank buckets.
const bucket = (rank) => (rank <= 100000 ? "top100k" : rank <= 1000000 ? "100k-1m" : rank <= 5000000 ? "1m-5m" : "5m+");
const byB = {}; withPast.forEach((m) => { const k = bucket(m.last.rank); (byB[k] ??= []).push(mean(m.res.map((x) => x.r))); });
console.log("this season residual by last season rank:", Object.fromEntries(Object.entries(byB).map(([k, v]) => [k, `${mean(v).toFixed(1)} (n=${v.length})`])));
const noPast = full.filter((m) => !m.last && m.res.length);
console.log(`no 2025/26 season: n=${noPast.length}, mean residual ${mean(noPast.map((m) => mean(m.res.map((x) => x.r)))).toFixed(1)}`);
// 4. Activity.
const idleCounts = {}; managers.forEach((m) => (idleCounts[Math.min(m.idle, 7)] = (idleCounts[Math.min(m.idle, 7)] ?? 0) + 1));
console.log("idle GWs at GW7 (since last transfer/WC/FH):", idleCounts);
const ghosts = full.filter((m) => m.idle >= 3), active = full.filter((m) => m.idle <= 1);
const recent = (m) => mean(m.res.slice(-3).map((x) => x.r));
const early = (m) => mean(m.res.slice(0, 3).map((x) => x.r));
console.log(`idle>=3: n=${ghosts.length} residual GW1-3 ${mean(ghosts.map(early)).toFixed(1)} → GW5-7 ${mean(ghosts.map(recent)).toFixed(1)} | active (idle<=1): n=${active.length} ${mean(active.map(early)).toFixed(1)} → ${mean(active.map(recent)).toFixed(1)}`);
const never = full.filter((m) => m.lastMove === 0);
console.log(`never transferred (no WC/FH either): n=${never.length}, residual GW1-3 ${never.length ? mean(never.map(early)).toFixed(1) : "-"} → GW5-7 ${never.length ? mean(never.map(recent)).toFixed(1) : "-"}`);
// Bench points (for Bench Boost value).
console.log(`mean points on bench per GW ${mean(managers.flatMap((m) => m.bench)).toFixed(1)}`);
const chipUse = {}; managers.forEach((m) => m.chips.forEach((c) => (chipUse[c.name] = (chipUse[c.name] ?? 0) + 1)));
console.log("chips used so far:", chipUse);
