// The Market view: award stories, Team of the Week, and the Market list.
// Story circles open the card image for now; the story viewer comes later.
import Link from "next/link";
import { copyFor, type Lang } from "@/lib/i18n";
import { SPARK_HEIGHT, SPARK_WIDTH, type MarketView as MarketModel } from "@/lib/screens/market";
import {
  marketRow, pitch, pitchLine, pitchMark, rowEnd, rowName, rowScore, rowTeam, rowText, sectionAside, sectionHead,
  sectionHeading, sparkBase, sparkLine, story, storyFace, storyGap, storyRing, storyRow, token, tokenName, tokenOwners,
  tokenPoints,
} from "@/lib/variants";
import { AwardEmoji, RankPill, TeamBadge } from "../ui/bits";

export function MarketView({ model, lang }: { model: MarketModel; lang: Lang }) {
  const t = copyFor(lang);
  const cardHref = (award: string) => `/cards/${model.leagueId}/${model.gw}/${award}?lang=${lang}`;
  return (
    <>
      <section aria-label={t.league.storiesLabel} className={storyRow()}>
        <Link href={cardHref("wrap")} className={story()}>
          <span className={storyRing()}>
            <span className={storyGap()}>
              <span className={storyFace({ kind: "wrap" })}>{t.league.storyGw(model.gw)}</span>
            </span>
          </span>
          {t.league.wrapped}
        </Link>
        {model.awards.map((award) => (
          <Link key={award} href={cardHref(award)} aria-label={t.awards[award]} className={story()}>
            <span className={storyRing()}>
              <span className={storyGap()}>
                <span className={storyFace({ kind: "award" })}>
                  <AwardEmoji award={award} />
                </span>
              </span>
            </span>
            {t.awardsShort[award]}
          </Link>
        ))}
      </section>

      <section aria-labelledby="totw">
        <div className={sectionHead()}>
          <h2 id="totw" className={sectionHeading()}>
            {t.league.teamOfTheWeek}
          </h2>
        </div>
        <div className={pitch()}>
          <span aria-hidden="true" className={pitchMark({ at: "topBox" })} />
          <span aria-hidden="true" className={pitchMark({ at: "halfway" })} />
          <span aria-hidden="true" className={pitchMark({ at: "circle" })} />
          <span aria-hidden="true" className={pitchMark({ at: "bottomBox" })} />
          {model.teamOfTheWeek.lines.map((line, i) => (
            <div key={i} className={pitchLine()}>
              {line.map((player) => (
                <div key={player.name} className={token()}>
                  <span className={tokenPoints({ top: player.top })}>
                    {player.points}
                    {player.ownedBy > 0 ? (
                      <span className={tokenOwners()} aria-label={`${player.ownedBy} ${t.league.owners}`}>
                        {player.ownedBy}
                      </span>
                    ) : null}
                  </span>
                  <span className={tokenName()}>{player.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="market">
        <div className={sectionHead()}>
          <h2 id="market" className={sectionHeading()}>
            {t.league.marketHeading}
          </h2>
          <span className={sectionAside()}>{t.league.gwScore}</span>
        </div>
        {model.rows.map((row) => {
          const { award, move, spark } = row;
          const words = move.direction === "up" ? t.league.moved.up(move.places) : move.direction === "down" ? t.league.moved.down(move.places) : t.league.moved.same;
          const body = (
            <>
              <TeamBadge value={row.badge} />
              <span className={rowText()}>
                <span className={rowName()}>
                  {row.firstName}
                  {award ? <AwardEmoji award={award} size={14} /> : null}
                </span>
                <span className={rowTeam()}>{row.teamName}</span>
              </span>
              <svg width={SPARK_WIDTH} height={SPARK_HEIGHT} viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`} aria-hidden="true">
                <line x1="0" y1={spark.baseY} x2={SPARK_WIDTH} y2={spark.baseY} className={sparkBase()} strokeDasharray="2 3" />
                <polyline points={spark.points} className={sparkLine({ direction: spark.direction })} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={rowEnd()}>
                <span className={rowScore()}>{row.net}</span>
                <RankPill move={move} words={words} />
              </span>
            </>
          );
          return award ? (
            <Link key={row.id} href={cardHref(award)} className={marketRow()}>
              {body}
            </Link>
          ) : (
            <div key={row.id} className={marketRow()}>
              {body}
            </div>
          );
        })}
      </section>
    </>
  );
}
