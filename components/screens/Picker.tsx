// After a team ID: every classic league they're in. Your leagues open, public
// ones folded behind a disclosure (no JavaScript: <details>).
import Link from "next/link";
import type { Lang } from "@/lib/cards/types";
import type { PickerRow, PickerView } from "@/lib/screens/picker";
import { copyFor } from "@/lib/ui/copy";
import { badgeFor } from "@/lib/ui/badge";
import {
  button, chevron, column, disclosure, disclosureChevron, disclosureSummary, group, groupHeading, listRow, listRowName,
  listRowValue, onSkyKicker, onSkyTitle, panel,
} from "@/lib/variants";
import { RankPill, TeamBadge } from "../ui/bits";
import { ChevronDown, ChevronRight } from "../ui/icons";

function Row({ row, lang }: { row: PickerRow; lang: Lang }) {
  const t = copyFor(lang).picker;
  const words =
    row.rank === null
      ? t.unranked
      : `rank ${row.rank}, ${row.move.direction === "up" ? `${t.up} ${row.move.places}` : row.move.direction === "down" ? `${t.down} ${row.move.places}` : t.same}`;
  return (
    <Link href={`/league/${row.id}`} className={listRow()}>
      <span className={listRowName()}>{row.name}</span>
      {row.rank !== null ? (
        <>
          <span aria-hidden="true" className={listRowValue()}>
            {row.rank}
          </span>
          <RankPill move={row.move} showPlaces={row.showPlaces} words={words} />
        </>
      ) : null}
      <ChevronRight className={chevron()} />
    </Link>
  );
}

export function Picker({ view, lang }: { view: PickerView; lang: Lang }) {
  const t = copyFor(lang).picker;
  const noPrivate = view.yours.length === 0;
  return (
    <div lang={lang} className={column({ gap: "md" })}>
      <header>
        <span className={onSkyKicker()}>
          <TeamBadge value={badgeFor(view.teamName)} size="sm" /> {view.firstName} · {view.teamName}
        </span>
        <h1 className={onSkyTitle()}>{t.title}</h1>
      </header>

      {noPrivate ? (
        <p role="status" className={panel({ tone: "note" })}>
          {t.noPrivate}
        </p>
      ) : (
        <section aria-labelledby="yours">
          <h2 id="yours" className={groupHeading()}>
            {t.yours}
          </h2>
          <div className={group()}>
            {view.yours.map((row) => (
              <Row key={row.id} row={row} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {view.public.length > 0 ? (
        <details className={disclosure()} open={noPrivate}>
          <summary className={disclosureSummary()}>
            <span>
              {t.public} · {view.public.length}
            </span>
            <ChevronDown className={disclosureChevron()} />
          </summary>
          <div className={group()}>
            {view.public.map((row) => (
              <Row key={row.id} row={row} lang={lang} />
            ))}
          </div>
        </details>
      ) : null}

      <Link href="/?start=1&mode=team" className={button({ intent: "quiet" })}>
        {t.notYou}
      </Link>
    </div>
  );
}
