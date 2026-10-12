// Fixture difficulty for every team over the next gameweeks. A table with a
// sticky team column; colour plus the printed difficulty number, so colour is
// never the only signal. Sorting is a pair of links (no JavaScript).
import Link from "next/link";
import { copyFor, type Lang } from "@/lib/i18n";
import type { FixturesView } from "@/lib/screens/fixtures";
import {
  column, fixture, fixtureBlank, fixtureOpponent, fixtureSub, legend, legendSwatch, onSkyRow, onSkyTitle, sectionAside,
  segment, segmented, ticker, tickerCell, tickerGw, tickerRow, tickerRun, tickerScroll, tickerShort, tickerTeam, visuallyHidden,
} from "@/lib/variants";
import { ThemeToggle } from "../ui/ThemeToggle";

const DIFFICULTIES = [1, 2, 3, 4, 5] as const;

export function Fixtures({ view, lang }: { view: FixturesView; lang: Lang }) {
  const t = copyFor(lang);
  const f = t.fixtures;
  const { rows, sort, gameweeks: gws } = view;
  const width = gws.length <= 3 ? "wide" : "normal";
  return (
    <div lang={lang} className={column({ gap: "md" })}>
      <header className={onSkyRow()}>
        <h1 className={onSkyTitle()}>{f.title}</h1>
        <ThemeToggle labels={t.theme} />
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
        <div role="table" aria-label={f.tableLabel(gws[0] ?? 0, gws.at(-1) ?? 0)} className={ticker()}>
          <div role="row" className={tickerRow()}>
            <span role="columnheader" className={tickerTeam()}>
              <span className={visuallyHidden()}>{f.teamColumn}</span>
            </span>
            {gws.map((gw) => (
              <span key={gw} role="columnheader" className={tickerGw({ width })}>
                {f.column(gw)}
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
                    ? `${f.week(week.gw)}: ${f.noMatch}`
                    : `${f.week(week.gw)}: ${week.matches.map((m) => f.match(m.opponent, m.home, m.difficulty)).join("; ")}`;
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
