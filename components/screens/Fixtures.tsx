// Fixture difficulty for every team over the next gameweeks. A table with a
// sticky team column; colour plus the printed difficulty number, so colour is
// never the only signal. Sorting is a pair of links (no JavaScript).
import Link from "next/link";
import type { Lang } from "@/lib/cards/types";
import { tickerGameweeks, type TickerRow, type TickerSort } from "@/lib/screens/tools";
import { copyFor } from "@/lib/ui/copy";
import {
  column, fixture, fixtureBlank, fixtureOpponent, fixtureSub, legend, legendSwatch, onSkyRow, onSkyTitle, sectionAside,
  segment, segmented, ticker, tickerCell, tickerGw, tickerRow, tickerRun, tickerScroll, tickerShort, tickerTeam, visuallyHidden,
} from "@/lib/variants";
import { ThemeToggle } from "../ui/ThemeToggle";

const DIFFICULTIES = [1, 2, 3, 4, 5] as const;

export function Fixtures({ rows, sort, lang }: { rows: readonly TickerRow[]; sort: TickerSort; lang: Lang }) {
  const t = copyFor(lang);
  const f = t.fixtures;
  const gws = tickerGameweeks(rows);
  const width = gws.length <= 3 ? "wide" : "normal";
  return (
    <div lang={lang} className={column({ gap: "md" })}>
      <header className={onSkyRow()}>
        <h1 className={onSkyTitle()}>{f.title}</h1>
        <ThemeToggle labels={{ system: t.theme.label(t.theme.system), light: t.theme.label(t.theme.light), dark: t.theme.label(t.theme.dark) }} />
      </header>

      <nav aria-label={f.sortLabel} className={segmented()}>
        <Link href="/fixtures" aria-current={sort === "easy" ? "page" : undefined} className={segment({ size: "sm" })}>
          {f.easiest}
        </Link>
        <Link href="/fixtures?sort=az" aria-current={sort === "az" ? "page" : undefined} className={segment({ size: "sm" })}>
          {f.az}
        </Link>
      </nav>

      <div className={tickerScroll()}>
        <div role="table" aria-label={`${f.title}, GW ${gws[0]}–${gws.at(-1)}`} className={ticker()}>
          <div role="row" className={tickerRow()}>
            <span role="columnheader" className={tickerTeam()}>
              <span className={visuallyHidden()}>Team</span>
            </span>
            {gws.map((gw) => (
              <span key={gw} role="columnheader" className={tickerGw({ width })}>
                GW{gw}
              </span>
            ))}
          </div>
          {rows.map((row) => (
            <div key={row.team.id} role="row" className={tickerRow()}>
              <span role="rowheader" className={tickerTeam()}>
                <abbr title={row.team.name} className={tickerShort()}>
                  {row.team.short}
                </abbr>
                <span className={tickerRun()} aria-label={f.runLabel(row.runScore)}>
                  {row.runScore}
                </span>
              </span>
              {row.weeks.map((week) => {
                const label =
                  week.matches.length === 0
                    ? `GW ${week.gw}: ${f.noMatch}`
                    : `GW ${week.gw}: ${week.matches.map((m) => `${m.opponent} ${m.home ? "home" : "away"}, difficulty ${m.difficulty}`).join("; ")}`;
                const layout = week.matches.length > 1 ? "double" : "single";
                return (
                  <span key={week.gw} role="cell" aria-label={label} className={tickerCell({ width })}>
                    {week.matches.length === 0 ? (
                      <span aria-hidden="true" className={fixtureBlank()}>
                        {f.noMatch}
                      </span>
                    ) : (
                      week.matches.map((m) => (
                        <span key={`${m.opponent}-${m.home}`} aria-hidden="true" className={fixture({ difficulty: m.difficulty, layout })}>
                          <span className={fixtureOpponent({ layout })}>{m.opponent}</span>
                          <span className={fixtureSub()}>
                            {m.home ? f.home : f.away} {m.difficulty}
                          </span>
                        </span>
                      ))
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className={legend()}>
        <span>{f.legendStart}</span>
        {DIFFICULTIES.map((d) => (
          <span key={d} className={legendSwatch({ difficulty: d })}>
            {d}
          </span>
        ))}
        <span>{f.legendEnd}</span>
      </div>
      <p className={sectionAside()}>{f.snapshot}</p>
    </div>
  );
}
