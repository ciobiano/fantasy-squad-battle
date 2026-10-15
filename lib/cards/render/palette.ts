// Card colours for one theme, from the Design System tokens (lib/tokens.ts).
import { colours } from "@/lib/tokens";
import type { CardTheme } from "../types";

export interface CardPalette {
  readonly bg: string;
  readonly ink: string;
  readonly ink2: string;
  readonly dash: string;
  readonly rule: string;
  readonly track: string;
  readonly tile: string;
  /** Bars and lines that aren't movement: the captain's best player, kept points, Middle Class. */
  readonly neutral: string;
  readonly up: string;
  readonly down: string;
  readonly onUp: string;
  readonly onDown: string;
  readonly frame: string;
  readonly onSky: string;
  readonly onSkyFill: string;
  readonly badgeInk: string;
}

export function palette(theme: CardTheme): CardPalette {
  const c = colours[theme];
  return {
    bg: c.bg,
    ink: c.ink,
    ink2: c["ink-2"],
    dash: c["ink-3"],
    rule: c["card-rule"],
    track: c.surface,
    tile: c.surface,
    neutral: theme === "dark" ? c["ink-2"] : c["ink-3"],
    up: c.up,
    down: c.down,
    onUp: c["on-up"],
    onDown: c["on-down"],
    frame: `linear-gradient(180deg, ${c["frame-top"]} 0%, ${c["frame-bottom"]} 100%)`,
    onSky: theme === "dark" ? "rgba(245, 246, 244, 0.82)" : "rgba(255, 255, 255, 0.86)",
    onSkyFill: c["on-sky-fill"],
    badgeInk: c["on-badge"],
  };
}
