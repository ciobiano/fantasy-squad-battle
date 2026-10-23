// The Team of the Week pitch (Matchday grass, Ralph 2026-10-13): mowing stripes
// and full chalk markings, drawn at 6:7 so circles stay round on any phone, and
// the same in both themes. Players wear their club's colours, never crests.
import { kitFor, type Kit } from "@/lib/ui/kits";
import { emptyShirt, kitPatterns, pitchMarkings, pitchPaint } from "@/lib/variants";

const W = 360;
const H = 420;
const STRIPES = 10;
const INSET = 10;
const BOX = { w: 176, h: 66 };
const SIX = { w: 80, h: 24 };

const stripeId = (club: string) => `kit-stripes-${club}`;

function StripeDefs({ clubs }: { clubs: readonly string[] }) {
  return (
    <defs>
      {clubs.map((club) => {
        const kit = kitFor(club);
        return (
          <pattern key={club} id={stripeId(club)} width="8" height="40" patternUnits="userSpaceOnUse">
            <rect width="8" height="40" fill={kit.body} />
            <rect x="4" width="4" height="40" fill={kit.trim} />
          </pattern>
        );
      })}
    </defs>
  );
}

/** The stripe patterns striped shirts use, for shirts drawn away from the pitch (lists, sheets). */
export function KitPatterns({ clubs }: { clubs: readonly string[] }) {
  return (
    <svg width="0" height="0" aria-hidden="true" className={kitPatterns()}>
      <StripeDefs clubs={clubs} />
    </svg>
  );
}

/** The pitch's ground and markings, plus the stripe patterns its striped shirts use. */
export function PitchMarkings({ stripedClubs }: { stripedClubs: readonly string[] }) {
  const line = { strokeWidth: 1.5, className: pitchPaint({ part: "line" }) } as const;
  const spot = pitchPaint({ part: "spot" });
  const ends = [
    { y: INSET, d: 1, sweep: 0 },
    { y: H - INSET, d: -1, sweep: 1 },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className={pitchMarkings()}>
      <StripeDefs clubs={stripedClubs} />
      <rect width={W} height={H} className={pitchPaint({ part: "ground" })} />
      {Array.from({ length: STRIPES / 2 }, (_, i) => (
        <rect key={i} y={(i * 2 * H) / STRIPES} width={W} height={H / STRIPES} className={pitchPaint({ part: "stripe" })} />
      ))}
      <rect x={INSET} y={INSET} width={W - 2 * INSET} height={H - 2 * INSET} rx={2} {...line} />
      <line x1={INSET} y1={H / 2} x2={W - INSET} y2={H / 2} {...line} />
      <circle cx={W / 2} cy={H / 2} r={40} {...line} />
      <circle cx={W / 2} cy={H / 2} r={2.5} className={spot} />
      {ends.map(({ y, d, sweep }) => (
        <g key={y}>
          <rect x={W / 2 - BOX.w / 2} y={d > 0 ? y : y - BOX.h} width={BOX.w} height={BOX.h} {...line} />
          <rect x={W / 2 - SIX.w / 2} y={d > 0 ? y : y - SIX.h} width={SIX.w} height={SIX.h} {...line} />
          <circle cx={W / 2} cy={y + d * 46} r={2} className={spot} />
          <path d={`M${W / 2 - 30} ${y + d * BOX.h} A40 40 0 0 ${sweep} ${W / 2 + 30} ${y + d * BOX.h}`} {...line} />
        </g>
      ))}
      <path d={`M${INSET} ${INSET + 8}A8 8 0 0 0 ${INSET + 8} ${INSET}`} {...line} />
      <path d={`M${W - INSET - 8} ${INSET}A8 8 0 0 0 ${W - INSET} ${INSET + 8}`} {...line} />
      <path d={`M${INSET} ${H - INSET - 8}A8 8 0 0 1 ${INSET + 8} ${H - INSET}`} {...line} />
      <path d={`M${W - INSET - 8} ${H - INSET}A8 8 0 0 1 ${W - INSET} ${H - INSET - 8}`} {...line} />
    </svg>
  );
}

const SHIRT = "M14 3 8 5 2 11 6 17 10 14 10 35 30 35 30 14 34 17 38 11 32 5 26 3C25 6 23 8 20 8S15 6 14 3Z";
const SLEEVES = "M8 5 2 11 6 17 10 14Z M32 5 38 11 34 17 30 14Z";
const COLLAR = "M14 3C15 6 17 8 20 8S25 6 26 3";

function collarColour(kit: Kit): string {
  if (kit.stripes || kit.trim !== kit.body) return kit.trim;
  return "rgba(255,255,255,0.7)";
}

/** A player's shirt in their club's colours. Striped shirts use the pitch's patterns. */
export function Shirt({ club }: { club: string }) {
  const kit = kitFor(club);
  const plainSleeves = !kit.stripes && kit.trim === kit.body;
  return (
    <svg width="34" height="32" viewBox="0 0 40 38" aria-hidden="true">
      <path d={SHIRT} fill={kit.stripes ? `url(#${stripeId(club)})` : kit.body} stroke="rgba(0,0,0,0.28)" strokeWidth={1} />
      {plainSleeves ? null : <path d={SLEEVES} fill={kit.stripes ? kit.body : kit.trim} />}
      <path d={COLLAR} fill="none" stroke={collarColour(kit)} strokeWidth={1.6} />
    </svg>
  );
}

/** A shirt still to fill, in a draft: dashed chalk with a plus. */
export function EmptyShirt() {
  return (
    <svg width="34" height="32" viewBox="0 0 40 38" aria-hidden="true">
      <path d={SHIRT} className={emptyShirt({ part: "shirt" })} strokeWidth={1.6} strokeDasharray="3 2.5" />
      <path d="M20 15v10M15 20h10" className={emptyShirt({ part: "plus" })} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}
