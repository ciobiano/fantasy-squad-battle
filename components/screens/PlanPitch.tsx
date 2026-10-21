// The planner's pitch and bench: each player is a button that opens his sheet.
// Same grass, chalk and shirts as Team of the Week (components/ui/Pitch).
import { stripedClubs } from "@/lib/ui/kits";
import {
  bench, benchHeading, benchName, benchPoints, benchRow, pitch, pitchLine, pitchLines, planToken, tokenFixture, tokenKit, tokenName,
  tokenNew, tokenPoints, tokenRole,
} from "@/lib/variants";
import { PitchMarkings, Shirt } from "../ui/Pitch";

export interface PlanToken {
  readonly id: number;
  readonly name: string;
  /** FPL's short club name, for the shirt. */
  readonly club: string;
  readonly points: string;
  readonly fixture: string;
  /** The captain's or vice's letter on the shirt, or null. */
  readonly role: string | null;
  readonly captain: boolean;
  /** Bought in this plan. */
  readonly isNew: boolean;
  readonly aria: string;
}

export interface TokenWords {
  readonly newBadge: string;
}

function Kit({ token, words }: { token: PlanToken; words: TokenWords }) {
  return (
    <span className={tokenKit()}>
      <Shirt club={token.club} />
      {token.role ? <span aria-hidden="true" className={tokenRole()}>{token.role}</span> : null}
      {token.isNew ? <span aria-hidden="true" className={tokenNew()}>{words.newBadge}</span> : null}
    </span>
  );
}

/** `clubs`: every club on the pitch and the bench, since the bench's striped shirts use the pitch's patterns too. */
export function PlanPitch({ rows, clubs, label, words, onPick }: { rows: readonly (readonly PlanToken[])[]; clubs: readonly string[]; label: string; words: TokenWords; onPick: (id: number) => void }) {
  return (
    <section aria-label={label} className={pitch()}>
      <PitchMarkings stripedClubs={stripedClubs(clubs)} />
      <div className={pitchLines()}>
        {rows.map((row, i) => (
          <div key={i} className={pitchLine()}>
            {row.map((t) => (
              <button key={t.id} type="button" aria-label={t.aria} className={planToken()} onClick={() => onPick(t.id)}>
                <Kit token={t} words={words} />
                <span aria-hidden="true" className={tokenPoints({ top: t.captain })}>
                  {t.points}
                </span>
                <span aria-hidden="true" className={tokenName()}>
                  {t.name}
                </span>
                <span aria-hidden="true" className={tokenFixture({ on: "pitch" })}>
                  {t.fixture}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function PlanBench({ tokens, heading, words, onPick }: { tokens: readonly PlanToken[]; heading: string; words: TokenWords; onPick: (id: number) => void }) {
  return (
    <section aria-labelledby="bench-h" className={bench()}>
      <h2 id="bench-h" className={benchHeading()}>
        {heading}
      </h2>
      <div className={benchRow()}>
        {tokens.map((t) => (
          <button key={t.id} type="button" aria-label={t.aria} className={planToken()} onClick={() => onPick(t.id)}>
            <Kit token={t} words={words} />
            <span aria-hidden="true" className={benchPoints()}>
              {t.points}
            </span>
            <span aria-hidden="true" className={benchName()}>
              {t.name}
            </span>
            <span aria-hidden="true" className={tokenFixture({ on: "surface" })}>
              {t.fixture}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
