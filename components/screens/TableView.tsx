// The classic season table, from FPL's standings (like the official app).
import { copyFor, type Lang } from "@/lib/i18n";
import type { TableView as TableModel } from "@/lib/screens/table";
import {
  moveText, panel, personCell, rowName, rowTeam, rowText, table, tableCell, tableHead, tableRow, visuallyHidden, youTag,
} from "@/lib/variants";
import { TeamBadge } from "../ui/bits";

export function TableView({ model, lang, gw }: { model: TableModel; lang: Lang; gw: number }) {
  const t = copyFor(lang).league;
  return (
    <>
      {model.truncated ? (
        <p role="status" className={panel({ tone: "note" })}>
          {t.top50}
        </p>
      ) : null}
      <table className={table()}>
        <caption className={visuallyHidden()}>{t.standingsCaption(gw)}</caption>
        <thead>
          <tr>
            <th scope="col" className={tableHead()}>{t.columns.pos}</th>
            <th scope="col" className={tableHead()}>{t.columns.manager}</th>
            <th scope="col" className={tableHead({ align: "right" })}>{t.columns.gw}</th>
            <th scope="col" className={tableHead({ align: "right" })}>{t.columns.total}</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.entry} aria-current={row.you ? "true" : undefined} className={tableRow({ you: row.you })}>
              <td className={tableCell({ tone: "strong" })}>
                {row.pos}
                <span className={moveText({ direction: row.move.direction })}>
                  {" "}
                  {row.move.direction === "up" ? `▲${row.move.places}` : row.move.direction === "down" ? `▼${row.move.places}` : "–"}
                </span>
              </td>
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
              <td className={tableCell({ align: "right", tone: "quiet" })}>{row.gw}</td>
              <td className={tableCell({ align: "right", tone: "strong" })}>{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
