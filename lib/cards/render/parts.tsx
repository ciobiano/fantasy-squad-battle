// Pieces shared by the award card and the Wrap card.
//
// These render through next/og (Satori), which reads only inline style objects:
// class names and CSS files don't exist there. So card styles are style objects,
// kept in this folder. That's the one exception to the CVA rule; app UI uses
// lib/variants.ts as usual.
import type { CSSProperties, ReactNode } from "react";
import { WATERMARK } from "../copy";
import { CARD_HEIGHT, CARD_WIDTH, sky } from "../geometry";
import type { BadgeShape, CardFormat, CardTheme, Manager } from "../types";
import { GRAIN_URL } from "./assets";
import type { CardPalette } from "./palette";

export const em = (size: number, value: number) => Math.round(size * value * 100) / 100;

/** Card-wide sizes per format, from the design canvas (A-Card, Main). */
export const SIZES = {
  status: {
    pad: "220px 72px 240px", gap: 40, footGap: 36, meta: 28, pillPad: "8px 22px", label: 40, labelEmoji: 44, idGap: 22,
    badge: 120, badgeText: 46, name: 104, team: 36, multiGap: 16, mBadge: 76, mBadgeText: 28, mName: 60,
    hero: 300, note: 64, notePadB: 6, framePad: "34px 36px", frameGap: 18, frameRadius: 40, small: 30, chartText: 28,
    bar: 28, barGap: 28, tilePad: "32px 12px", tileRadius: 36, tileName: 28, tilePts: 80, hitBar: 64,
    roast: 54, mark: 36,
  },
  x: {
    pad: "72px", gap: 24, footGap: 20, meta: 26, pillPad: "6px 18px", label: 32, labelEmoji: 34, idGap: 14,
    badge: 84, badgeText: 32, name: 72, team: 28, multiGap: 10, mBadge: 52, mBadgeText: 20, mName: 42,
    hero: 200, note: 44, notePadB: 4, framePad: "20px 28px", frameGap: 10, frameRadius: 32, small: 24, chartText: 22,
    bar: 18, barGap: 16, tilePad: "18px 8px", tileRadius: 28, tileName: 22, tilePts: 52, hitBar: 40,
    roast: 40, mark: 30,
  },
} as const;
export type Sizes = (typeof SIZES)[CardFormat];

const BADGE_RADIUS: Record<BadgeShape, string> = { circle: "50%", squircle: "28%", shield: "22% 22% 50% 50%" };

interface CardFrameProps {
  readonly format: CardFormat;
  readonly theme: CardTheme;
  readonly p: CardPalette;
  readonly children: ReactNode;
}

/** The card ground, the Mist sky with its grain, and the padded layout. */
export function CardFrame({ format, theme, p, children }: CardFrameProps) {
  const s = sky(theme, format);
  const root: CSSProperties = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: CARD_WIDTH,
    height: CARD_HEIGHT[format],
    padding: SIZES[format].pad,
    background: p.bg,
    color: p.ink,
    fontFamily: "Inter",
  };
  return (
    <div style={root}>
      <div style={{ position: "absolute", left: 0, top: 0, display: "flex", width: CARD_WIDTH, height: s.height, backgroundImage: s.background }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: CARD_WIDTH,
            height: s.height,
            opacity: 0.16,
            backgroundImage: `url(${GRAIN_URL})`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
            maskImage: "linear-gradient(to bottom, #000 40%, transparent 100%)",
          }}
        />
      </div>
      {children}
    </div>
  );
}

/** League name, then the GW pill (and Provisional) on the deep teal. */
export function MetaRow({ league, gw, provisional, z, p }: { league: string; gw: string; provisional: string | null; z: Sizes; p: CardPalette }) {
  const pill: CSSProperties = { display: "flex", padding: z.pillPad, borderRadius: 999, background: p.onSkyFill };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: z.meta,
        fontWeight: 600,
        letterSpacing: em(z.meta, 0.12),
        textTransform: "uppercase",
        color: p.onSky,
      }}
    >
      <span>{league}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12, letterSpacing: em(z.meta, 0.08) }}>
        {provisional ? <span style={pill}>{provisional}</span> : null}
        <span style={pill}>{gw}</span>
      </div>
    </div>
  );
}

export function Badge({ manager, size, text, p }: { manager: Manager; size: number; text: number; p: CardPalette }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: BADGE_RADIUS[manager.badge.shape],
        background: manager.badge.colour,
        color: p.badgeInk,
        fontSize: text,
        fontWeight: 700,
        letterSpacing: em(text, -0.02),
      }}
    >
      {manager.badge.initials}
    </div>
  );
}

/** ▲ or ▼ drawn as a shape: the card fonts don't carry these glyphs. Sits on the text baseline. */
export function Triangle({ direction, size, colour }: { direction: "up" | "down"; size: number; colour: string }) {
  const width = Math.round(size * 1.12);
  const points = direction === "up" ? `0,${size} ${width / 2},0 ${width},${size}` : `0,0 ${width},0 ${width / 2},${size}`;
  return (
    <svg width={width} height={size} viewBox={`0 0 ${width} ${size}`} style={{ flexShrink: 0 }}>
      <polygon points={points} fill={colour} />
    </svg>
  );
}

/** The wordmark square (a tiny sky) and the app's address. */
export function Watermark({ z, p }: { z: Sizes; p: CardPalette }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: z.meta, fontWeight: 600, color: p.ink2 }}>
      <div style={{ display: "flex", width: z.mark, height: z.mark, borderRadius: 10, backgroundImage: "linear-gradient(180deg, #143A53 0%, #7DA4A5 60%, #D5F1E5 100%)" }} />
      <span>{WATERMARK}</span>
    </div>
  );
}

export const frameStyle = (z: Sizes, p: CardPalette): CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  gap: z.frameGap,
  padding: z.framePad,
  border: `2px solid ${p.rule}`,
  borderRadius: z.frameRadius,
  backgroundImage: p.frame,
});
