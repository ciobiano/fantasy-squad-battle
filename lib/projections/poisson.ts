// Goals, saves and defensive actions in one match, treated as Poisson counts.
// Good enough for averages over a squad and a few gameweeks; the tails of
// defensive actions are wider in reality (noted in CLAUDE.md, D7).

/** Chance of exactly k events when `mean` are expected. */
export function poisson(k: number, mean: number): number {
  if (mean <= 0) return k === 0 ? 1 : 0;
  let p = Math.exp(-mean);
  for (let i = 1; i <= k; i++) p *= mean / i;
  return p;
}

/** Chance of k or more events. */
export function atLeast(k: number, mean: number): number {
  let below = 0;
  for (let i = 0; i < k; i++) below += poisson(i, mean);
  return Math.max(0, 1 - below);
}

/** Expected value of floor(X / n): points that come per n events, like one per three saves. */
export function expectedPer(n: number, mean: number): number {
  if (mean <= 0) return 0;
  const last = Math.ceil(mean + 10 * Math.sqrt(mean) + 10);
  let sum = 0;
  for (let k = n; k <= last; k++) sum += Math.floor(k / n) * poisson(k, mean);
  return sum;
}
