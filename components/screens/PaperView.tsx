// League · On paper: every squad rated over the coming gameweeks and ranked,
// beside its real table position, under one line of banter.
import { copyFor, type Lang } from "@/lib/i18n";
import type { PaperView as PaperModel } from "@/lib/screens/paper";
import {
  panel, paperHeadline, paperHeadlineSub, personCell, rowName, rowTeam, rowText, shareNote, table, tableCell, tableHead, tableRow,
  visuallyHidden, youTag,
} from "@/lib/variants";
import { TeamBadge } from "../ui/bits";

export function PaperView({ model, lang }: { model: PaperModel; lang: Lang }) {
  const t = copyFor(lang).league;
  const { headline, firstGw, lastGw } = model;
  return (
    <>
      {headline ? (
        <section aria-label={t.paperView} className={panel()}>
          <p className={paperHeadline()}>{t.paperBest(headline.best)}</p>
          <p className={paperHeadlineSub()}>
            {headline.leader === headline.best ? t.paperLeaderToo : t.paperLeader(headline.leader, headline.leaderRank)}
          </p>
        </section>
      ) : null}
      {model.truncated ? (
        <p role="status" className={panel({ tone: "note" })}>
          {t.top50}
        </p>
      ) : null}
      <table className={table()}>
        <caption className={visuallyHidden()}>{t.paperCaption(firstGw, lastGw)}</caption>
        <thead>
          <tr>
            <th scope="col" className={tableHead()}>{t.paperColumns.rank}</th>
            <th scope="col" className={tableHead()}>{t.paperColumns.manager}</th>
            <th scope="col" className={tableHead({ align: "right" })}>{t.paperColumns.points(firstGw, lastGw)}</th>
            <th scope="col" className={tableHead({ align: "right" })}>{t.paperColumns.table}</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.entry} aria-current={row.you ? "true" : undefined} className={tableRow({ you: row.you })}>
              <td className={tableCell({ tone: "strong" })}>{row.rank}</td>
              <th scope="row" className={tableCell()}>
                <span className={personCell()}>
                  <TeamBadge value={row.badge} />
                  <span className={rowText()}>
                    <span className={rowName()}>
                      {row.firstName}
                      {row.you ? <span className={youTag()}>{t.you}</span> : null}
                    </span>
                    <span className={rowTeam()}>{row.teamName}</span>
                  </span>
                </span>
              </th>
              <td className={tableCell({ align: "right", tone: "strong" })}>{Math.round(row.points)}</td>
              <td className={tableCell({ align: "right", tone: "quiet" })}>{t.ordinal(row.leagueRank)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={shareNote()}>{t.paperNote}</p>
    </>
  );
}
