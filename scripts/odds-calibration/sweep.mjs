import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const DIR = process.argv[2] ?? join(tmpdir(), "fsb-odds-calibration");
mkdirSync(DIR, { recursive: true });
import { readFileSync } from "node:fs";
const data = JSON.parse(readFileSync(join(DIR, "data.json")));
const boot = JSON.parse(readFileSync(join(DIR, "bootstrap.json")));
const avg = Object.fromEntries(boot.events.filter((e) => e.average_entry_score).map((e) => [e.id, e.average_entry_score]));
const END = 7, PAST_MEAN = 52.3, NO_PAST = -3.8;
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const Phi = (z) => 0.5 * (1 + Math.tanh(0.7978845608 * (z + 0.044715 * z ** 3)));
const st = (h, k, slope) => { const rows = h.current.filter((c) => c.event <= k); const last = h.past.find((p) => p.season === "2025/26"); return { total: rows.reduce((s, c) => s + c.points - c.cost, 0), res: rows.map((c) => c.points - c.cost - avg[c.event]), prior: last ? slope * (last.total / 38 - PAST_MEAN) : NO_PAST }; };
function run(k, sigma, tau, slope, buckets) {
  const h = END - k; let loss = 0, n = 0;
  for (const league of data.leagues) {
    const ms = league.members.map((m) => data.histories[m.entry]).filter((x) => x && x.current.some((c) => c.event === END));
    const S = ms.map((x) => ({ ...st(x, k, slope), final: st(x, END, slope).total }));
    const mu = S.map((s) => { const w = tau ** 2 / (tau ** 2 + sigma ** 2 / Math.max(1, s.res.length)); return s.prior + w * (mean(s.res) - s.prior); });
    for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
      if (S[i].final === S[j].final) continue;
      const p = Phi((S[i].total - S[j].total + (mu[i] - mu[j]) * h) / (Math.SQRT2 * sigma * Math.sqrt(h)));
      const y = S[i].final > S[j].final ? 1 : 0;
      loss -= Math.log(Math.min(1 - 1e-6, Math.max(1e-6, y ? p : 1 - p))); n++;
      if (buckets) { const pp = p >= 0.5 ? p : 1 - p, yy = p >= 0.5 ? y : 1 - y; const b = Math.min(4, Math.floor((pp - 0.5) / 0.1)); (buckets[b] ??= [0, 0, 0]); buckets[b][0] += pp; buckets[b][1] += yy; buckets[b][2]++; }
    }
  }
  return loss / n;
}
for (const k of [3, 4]) {
  const rows = [];
  for (const sm of [0.8, 0.9, 1.0, 1.1, 1.2]) for (const tau of [3, 4.8, 6]) for (const slope of [0, 0.24, 0.4]) rows.push([run(k, 12.4 * sm, tau, slope), `sigma ${(12.4 * sm).toFixed(1)} tau ${tau} slope ${slope}`]);
  rows.sort((a, b) => a[0] - b[0]);
  console.log(`GW${k}→7 best:`, rows.slice(0, 4).map(([l, s]) => `${l.toFixed(4)} ${s}`).join(" | "));
  console.log(`         chosen (12.4, 4.8, 0.24): ${run(k, 12.4, 4.8, 0.24).toFixed(4)}`);
  const b = []; run(k, 12.4, 4.8, 0.24, b);
  console.log("  calibration (predicted → actual, n):", b.map((x, i) => x ? `${(50 + i * 10)}-${60 + i * 10}%: ${(100 * x[0] / x[2]).toFixed(0)}% → ${(100 * x[1] / x[2]).toFixed(0)}% (${x[2]})` : "").filter(Boolean).join(" | "));
}
