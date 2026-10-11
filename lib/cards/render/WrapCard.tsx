// The "GW Wrapped" share card (Status or X, light or dark), for next/og.
// Layout follows the design canvas's Main: sky with league and GW, the title and
// league average on the mint, every award as one row in a frame, the watermark.
import { decimal, labels, title } from "../copy";
import type { CardOptions, WrapCardModel } from "../types";
import { AWARD_EMOJI_URL } from "./assets";
import { palette } from "./palette";
import { CardFrame, MetaRow, SIZES, Triangle, Watermark, em } from "./parts";

const WRAP = {
  status: { air: 160, gap: 32, framePad: "8px 32px", rowGap: 26, rowPad: "10px 0", tile: 72, tileRadius: 22, tileEmoji: 40, rowTitle: 34, rowWho: 26, value: 40 },
  x: { air: 80, gap: 22, framePad: "2px 24px", rowGap: 20, rowPad: "5px 0", tile: 44, tileRadius: 14, tileEmoji: 26, rowTitle: 24, rowWho: 19, value: 30 },
} as const;

export function WrapCard({ model, options }: { model: WrapCardModel; options: CardOptions }) {
  const { format, theme, lang } = options;
  const z = SIZES[format];
  const w = WRAP[format];
  const p = palette(theme);
  const l = labels(lang);
  const average = decimal(model.leagueAverage, lang);

  return (
    <CardFrame format={format} theme={theme} p={p}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: w.gap }}>
        <MetaRow league={model.meta.leagueName} gw={l.gw(model.meta.gw)} provisional={model.meta.provisional ? l.provisional : null} z={z} p={p} />
        <div style={{ display: "flex", height: w.air, flexShrink: 0 }} />

        {format === "status" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 52, fontWeight: 700, letterSpacing: em(52, -0.025) }}>{l.wrapTitle(model.meta.gw)}</span>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 20 }}>
              <span style={{ fontSize: 196, fontWeight: 700, letterSpacing: em(196, -0.05), lineHeight: 0.92 }}>{average}</span>
              <span style={{ fontSize: 52, fontWeight: 400, letterSpacing: em(52, -0.02) }}>{l.leagueAverage}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: em(40, -0.02) }}>{l.wrapTitle(model.meta.gw)}</span>
              <span style={{ fontSize: 28, fontWeight: 400 }}>{l.leagueAverage}</span>
            </div>
            <span style={{ fontSize: 150, fontWeight: 700, letterSpacing: em(150, -0.05), lineHeight: 0.92 }}>{average}</span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: w.framePad,
            border: `2px solid ${p.rule}`,
            borderRadius: z.frameRadius,
            backgroundImage: p.frame,
          }}
        >
          {model.rows.map((row, i) => {
            const pill =
              row.movement === "up"
                ? { background: p.up, color: p.onUp }
                : row.movement === "down"
                  ? { background: p.down, color: p.onDown }
                  : { background: "transparent", color: p.ink };
            return (
              <div
                key={row.award}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: w.rowGap,
                  padding: w.rowPad,
                  borderTop: i === 0 ? "0" : `2px solid ${p.rule}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: w.tile,
                    height: w.tile,
                    flexShrink: 0,
                    borderRadius: w.tileRadius,
                    background: p.tile,
                    fontSize: w.tileEmoji,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain img; next/image doesn't exist there */}
                  <img src={AWARD_EMOJI_URL[row.award]} width={w.tileEmoji} height={w.tileEmoji} alt="" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1, minWidth: 0 }}>
                  <span style={{ fontSize: w.rowTitle, fontWeight: 600, letterSpacing: em(w.rowTitle, -0.01) }}>{title(row.award, lang)}</span>
                  <span style={{ fontSize: w.rowWho, color: p.ink2 }}>{row.groupLine ?? row.winners.join(", ")}</span>
                </div>
                {row.value ? (
                  <span style={{ display: "flex", alignItems: "center", gap: Math.round(w.value * 0.2), padding: "6px 20px", borderRadius: 999, fontSize: w.value, fontWeight: 700, ...pill }}>
                    {row.movement ? <Triangle direction={row.movement} size={Math.round(w.value * 0.56)} colour={pill.color} /> : null}
                    {row.value}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "relative", display: "flex" }}>
        <Watermark z={z} p={p} />
      </div>
    </CardFrame>
  );
}
