// Sizes and shapes for the share cards: the Mist sky, the space above the winner,
// and the charts fitted into their frames. Pure functions, unit tested.
import type { CardFormat, CardTheme } from "./types";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT: Record<CardFormat, number> = { status: 1920, x: 1080 };

// Sky stops sampled from Ralph's reference (2026-10-10). Low chroma keeps it clear
// of the Premier League palette (docs/design/brief.md, "Our gradient").
const SKY = {
  light: {
    lead: "#1F4459",
    stops: ["#315569", "#4B6F7F", "#658A92", "#7DA4A5", "#93BDB7", "#A7D1C7", "#B9E0D3", "#C8EBDD", "#D5F1E5", "#E0F5EC", "#EAF8F1", "#F1F9F7", "#F8FBFA", "#FFFFFF"],
  },
  dark: {
    lead: "#18405A",
    stops: ["#1D4859", "#22505A", "#265858", "#255452", "#204846", "#1A3A38", "#142D2B", "#10211F", "#0C1715", "#0A0F0E", "#08090A"],
  },
} as const;

/** Where the deep teal ends and where the sky has fully faded, per format. */
const SKY_SPAN: Record<CardFormat, { lead: number; end: number }> = {
  status: { lead: 200, end: 1250 },
  x: { lead: 100, end: 720 },
};

export interface Sky {
  readonly height: number;
  readonly background: string;
}

export function sky(theme: CardTheme, format: CardFormat): Sky {
  const { lead, end } = SKY_SPAN[format];
  const profile = SKY[theme];
  const n = profile.stops.length;
  const stops = [`#143A53 0px`, `${profile.lead} ${lead}px`].concat(
    profile.stops.map((colour, i) => `${colour} ${Math.round(lead + ((end - lead) * (i + 1)) / n)}px`),
  );
  const linear = `linear-gradient(180deg, ${stops.join(", ")})`;
  if (theme === "light") return { height: end, background: linear };
  // Dark: a soft mint glow sits in the upper middle of the sky.
  const glow = `radial-gradient(756px ${Math.round((end - lead) * 0.45)}px at 648px ${Math.round(lead + (end - lead) * 0.28)}px, rgba(141, 184, 180, 0.2), rgba(141, 184, 180, 0))`;
  return { height: end, background: `${glow}, ${linear}` };
}

/**
 * Empty sky above the award label. Groups of winners take more room, so it
 * shrinks; a card with no chart or tiles drops its block lower, so the space
 * the visual left is shared above and below rather than all above the roast.
 */
export function airAbove(format: CardFormat, winnerCount: number, visual = true): number {
  const bare = visual ? 0 : format === "x" ? 56 : 140;
  const shown = Math.min(winnerCount, 3);
  if (shown <= 1) return (format === "x" ? 120 : 230) + bare;
  const single = format === "x" ? 104 : 144;
  const group = format === "x" ? shown * 52 + (shown - 1) * 10 : shown * 76 + (shown - 1) * 16;
  return Math.max(format === "x" ? 64 : 80, (format === "x" ? 120 : 230) - Math.max(0, group - single)) + bare;
}

/** Inner size of a card's chart frame. */
export const chartBox = (format: CardFormat) => ({ width: format === "x" ? 876 : 860, height: format === "x" ? 92 : 190 });

export interface Point {
  readonly x: number;
  readonly y: number;
}

const fmt = (points: readonly Point[]) => points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

export interface TrendChart {
  readonly points: string;
  /** The line's points closed down to the zero line, for the soft fill. */
  readonly area: string;
  readonly zeroY: number;
  readonly end: Point;
}

/** Season total minus the league average per GW, against a dashed zero line. */
export function trendChart(gaps: readonly number[], width: number, height: number): TrendChart {
  const values = gaps.length > 1 ? gaps : [0, ...gaps];
  const top = height * 0.16;
  const bottom = height * 0.84;
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const y = (v: number) => top + ((max - v) / span) * (bottom - top);
  const step = (width - 40) / (values.length - 1);
  const points = values.map((v, i) => ({ x: 20 + i * step, y: y(v) }));
  const zeroY = y(0);
  const end = points[points.length - 1];
  const area = `${fmt(points)} ${end.x.toFixed(1)},${zeroY.toFixed(1)} 20.0,${zeroY.toFixed(1)}`;
  return { points: fmt(points), area, zeroY, end };
}

export interface RankLine {
  readonly points: string;
  readonly end: Point;
  /** Where the end label sits; kept a line apart from its neighbours. */
  readonly labelY: number;
}

export interface RankChart {
  readonly lines: readonly RankLine[];
  readonly endX: number;
  readonly labelX: number;
  readonly topY: number;
  readonly bottomY: number;
}

/**
 * League position by GW, better ranks at the top, one line per winner, labelled at
 * its end. The scale spans only the ranks shown (one place of margin each side), so
 * close movers such as the Middle Class don't collapse into one line.
 */
export function rankChart(
  series: readonly (readonly number[])[],
  leagueSize: number,
  width: number,
  height: number,
  labelSize: number,
): RankChart {
  const endX = width - 170;
  const topY = 16;
  const bottomY = height - 16;
  const all = series.flat();
  const lo = Math.max(1, Math.min(...all) - 1);
  const hi = Math.min(Math.max(leagueSize, lo + 1), Math.max(...all) + 1);
  const y = (rank: number) => topY + ((rank - lo) / Math.max(1, hi - lo)) * (bottomY - topY);
  const lines = series.map((ranks) => {
    const step = ranks.length > 1 ? (endX - 20) / (ranks.length - 1) : 0;
    const points = ranks.map((rank, i) => ({ x: ranks.length > 1 ? 20 + i * step : endX, y: y(rank) }));
    return { points: fmt(points), end: points[points.length - 1] };
  });
  // Push labels apart (top to bottom), then pull the group back inside the frame.
  const order = lines.map((line, i) => ({ i, y: line.end.y })).sort((a, b) => a.y - b.y);
  const gap = labelSize + 4;
  order.forEach((item, k) => {
    if (k > 0 && item.y < order[k - 1].y + gap) item.y = order[k - 1].y + gap;
  });
  const overflow = order.length ? order[order.length - 1].y - (height - 12) : 0;
  if (overflow > 0) order.forEach((item) => (item.y -= overflow));
  const labelYs = new Map(order.map((item) => [item.i, item.y]));
  return {
    lines: lines.map((line, i) => ({ ...line, labelY: labelYs.get(i) ?? line.end.y })),
    endX,
    labelX: endX + 30,
    topY,
    bottomY,
  };
}

/** Bar width in percent, never thinner than a sliver so zero still shows. */
export const barPercent = (value: number, max: number): number =>
  max <= 0 ? 2 : Math.max(2, Math.round((Math.max(0, value) / max) * 100));
