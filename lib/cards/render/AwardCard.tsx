// One award's share card (Status or X, light or dark), for next/og.
// Layout follows the design canvas's A-Card: sky with league and GW, award and
// winner on the mint, the big number with its context, one visual in a frame,
// then the roast and the watermark at the bottom. See parts.tsx on why styles
// are inline objects here.
import { copyFor, type Lang } from "@/lib/i18n";
import { describe, ordinal } from "../copy";
import { airAbove, barPercent, chartBox, rankChart, trendChart } from "../geometry";
import type { AwardCardModel, AwardFacts, CardOptions } from "../types";
import { AWARD_EMOJI_URL } from "./assets";
import { palette, type CardPalette } from "./palette";
import { Badge, CardFrame, MetaRow, SIZES, Triangle, Watermark, em, frameStyle, type Sizes } from "./parts";

const MAX_NAMED = 3;

export function AwardCard({ model, options }: { model: AwardCardModel; options: CardOptions }) {
  const { format, theme, lang } = options;
  const z = SIZES[format];
  const p = palette(theme);
  const t = copyFor(lang);
  const l = t.card;
  const award = model.facts.award;
  const named = model.winners.slice(0, MAX_NAMED);
  const others = model.winners.length - named.length;
  const { value, arrow, note, message } = describe(model.facts, model.winners.length, lang);

  return (
    <CardFrame format={format} theme={theme} p={p} grain={!options.preview}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: z.gap }}>
        <MetaRow league={model.meta.leagueName} gw={l.gw(model.meta.gw)} provisional={model.meta.provisional ? l.provisional : null} z={z} p={p} />
        <div style={{ display: "flex", height: airAbove(format, model.winners.length), flexShrink: 0 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: z.idGap }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: z.label, fontWeight: 600 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain img; next/image doesn't exist there */}
            <img src={AWARD_EMOJI_URL[award]} width={z.labelEmoji} height={z.labelEmoji} alt="" />
            <span>{t.awards[award]}</span>
          </div>
          {named.length === 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <Badge manager={named[0]} size={z.badge} text={z.badgeText} p={p} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: z.name, fontWeight: 700, letterSpacing: em(z.name, -0.035), lineHeight: 1 }}>{named[0].firstName}</span>
                <span style={{ fontSize: z.team, fontWeight: 400 }}>{named[0].teamName}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: z.multiGap }}>
              {named.map((m) => (
                <div key={m.firstName} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <Badge manager={m} size={z.mBadge} text={z.mBadgeText} p={p} />
                  <span style={{ fontSize: z.mName, fontWeight: 700, letterSpacing: em(z.mName, -0.03), lineHeight: 1 }}>{m.firstName}</span>
                </div>
              ))}
              {others > 0 ? <span style={{ fontSize: z.team, fontWeight: 600 }}>{l.others(others)}</span> : null}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: em(z.hero, 0.06) }}>
            {arrow ? (
              <div style={{ display: "flex", paddingBottom: Math.round(z.hero * 0.04) }}>
                <Triangle direction={arrow} size={Math.round(z.hero * 0.6)} colour={p.ink} />
              </div>
            ) : null}
            <span style={{ fontSize: z.hero, fontWeight: 700, letterSpacing: em(z.hero, -0.06), lineHeight: 0.82 }}>{value}</span>
          </div>
          {note ? (
            <span style={{ paddingBottom: z.notePadB, fontSize: z.note, fontWeight: 600, letterSpacing: em(z.note, -0.02), color: p.ink2 }}>{note}</span>
          ) : null}
        </div>

        <Visual facts={model.facts} message={message} format={format} lang={lang} names={named.map((m) => m.firstName)} z={z} p={p} />
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: z.footGap }}>
        <div style={{ display: "flex", fontSize: z.roast, fontWeight: 600, lineHeight: 1.18, letterSpacing: em(z.roast, -0.015) }}>{model.roast}</div>
        <Watermark z={z} p={p} />
      </div>
    </CardFrame>
  );
}

interface VisualProps {
  readonly facts: AwardFacts;
  readonly message: string;
  readonly format: CardOptions["format"];
  readonly lang: Lang;
  readonly names: readonly string[];
  readonly z: Sizes;
  readonly p: CardPalette;
}

function Visual({ facts, message, format, lang, names, z, p }: VisualProps) {
  const box = chartBox(format);
  const l = copyFor(lang).card;
  switch (facts.award) {
    case "oga":
    case "spoon": {
      const t = trendChart(facts.gapByGw, box.width, box.height);
      const colour = facts.award === "oga" ? p.up : p.down;
      return (
        <div style={frameStyle(z, p)}>
          <span style={{ fontSize: z.small, fontWeight: 600, letterSpacing: em(z.small, 0.08), textTransform: "uppercase", color: p.ink2 }}>{message}</span>
          <svg width={box.width} height={box.height} viewBox={`0 0 ${box.width} ${box.height}`}>
            <polygon points={t.area} fill={colour} fillOpacity={0.14} />
            <line x1={0} y1={t.zeroY} x2={box.width} y2={t.zeroY} stroke={p.dash} strokeWidth={3} strokeDasharray="8 8" strokeLinecap="round" />
            <polyline points={t.points} fill="none" stroke={colour} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={t.end.x} cy={t.end.y} r={12} fill={colour} stroke={p.bg} strokeWidth={6} />
          </svg>
        </div>
      );
    }
    case "climber":
    case "faller":
    case "middle": {
      const height = format === "x" ? 110 : box.height;
      const r = rankChart(facts.rankByGw, facts.leagueSize, box.width, height, z.chartText);
      const colour = facts.award === "climber" ? p.up : facts.award === "faller" ? p.down : p.neutral;
      const label = (i: number) => {
        if (facts.award === "middle") return names[i] ?? "";
        const last = facts.rankByGw[i]?.at(-1) ?? 0;
        return facts.rankByGw.length > 1 ? `${names[i] ?? ""} ${ordinal(last, lang)}` : ordinal(last, lang);
      };
      return (
        <div style={{ ...frameStyle(z, p), flexDirection: "row" }}>
          <div style={{ position: "relative", display: "flex", width: box.width, height }}>
            <svg width={box.width} height={height} viewBox={`0 0 ${box.width} ${height}`} style={{ position: "absolute", left: 0, top: 0 }}>
              <line x1={0} y1={r.topY} x2={r.endX} y2={r.topY} stroke={p.rule} strokeWidth={2} />
              <line x1={0} y1={r.bottomY} x2={r.endX} y2={r.bottomY} stroke={p.rule} strokeWidth={2} />
              {r.lines.map((line, i) => (
                <g key={i}>
                  <polyline points={line.points} fill="none" stroke={colour} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
                  <line x1={line.end.x} y1={line.end.y} x2={r.endX + 22} y2={line.labelY} stroke={colour} strokeWidth={2} strokeLinecap="round" />
                  <circle cx={line.end.x} cy={line.end.y} r={12} fill={colour} stroke={p.bg} strokeWidth={6} />
                </g>
              ))}
            </svg>
            {r.lines.map((line, i) => (
              <span
                key={i}
                style={{ position: "absolute", left: r.labelX, top: line.labelY - z.chartText * 0.62, fontSize: z.chartText, fontWeight: 600, color: p.ink2 }}
              >
                {label(i)}
              </span>
            ))}
          </div>
        </div>
      );
    }
    case "captain": {
      if (!facts.best) return null;
      const max = Math.max(facts.captain.points, facts.best.points, 1);
      const bestLabel = facts.best.scope === "team" ? l.best(facts.best.name) : l.topThisWeek(facts.best.name);
      const bars = [
        { label: l.captain(facts.captain.name), value: facts.captain.points, colour: p.down },
        { label: bestLabel, value: facts.best.points, colour: p.neutral },
      ];
      return (
        <div style={{ ...frameStyle(z, p), gap: z.barGap }}>
          {bars.map((bar) => (
            <div key={bar.label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: z.small }}>
                <span style={{ color: p.ink2 }}>{bar.label}</span>
                <span style={{ fontWeight: 700 }}>{String(bar.value)}</span>
              </div>
              <div style={{ display: "flex", height: z.bar, borderRadius: 999, background: p.track }}>
                <div style={{ display: "flex", width: `${barPercent(bar.value, max)}%`, borderRadius: 999, background: bar.colour }} />
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "bench":
      if (facts.players.length === 0) return null;
      return (
        <div style={{ display: "flex", gap: 16 }}>
          {facts.players.map((player) => (
            <div
              key={player.name}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                flexGrow: 1,
                flexBasis: 0,
                padding: z.tilePad,
                border: `2px solid ${p.rule}`,
                borderRadius: z.tileRadius,
                backgroundImage: p.frame,
              }}
            >
              <span style={{ fontSize: z.tilePts, fontWeight: 700, letterSpacing: em(z.tilePts, -0.04), lineHeight: 1 }}>{String(player.points)}</span>
              <span style={{ fontSize: z.tileName, fontWeight: 600, color: p.ink2 }}>{player.name}</span>
            </div>
          ))}
        </div>
      );
    case "hits": {
      const kept = Math.max(0, facts.gross - facts.paid);
      return (
        <div style={{ ...frameStyle(z, p), gap: 14 }}>
          <div style={{ display: "flex", gap: 6, height: z.hitBar }}>
            <div style={{ display: "flex", flexGrow: kept || 1, flexBasis: 0, borderRadius: "16px 6px 6px 16px", background: p.neutral }} />
            <div style={{ display: "flex", flexGrow: facts.paid || 1, flexBasis: 0, borderRadius: "6px 16px 16px 6px", background: p.down }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: z.small, fontWeight: 600 }}>
            <span>{`${kept} ${l.kept}`}</span>
            <span>{`${facts.paid} ${l.paid}`}</span>
          </div>
        </div>
      );
    }
  }
}
