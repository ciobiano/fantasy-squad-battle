// The League tab for one league: header, then the Market, the Table or On paper.
// lib/screens/league.ts decides what's shown; this only draws it.
import Link from "next/link";
import { copyFor, type Lang } from "@/lib/i18n";
import type { LeagueView } from "@/lib/screens/league";
import { button, column, panel, panelBody } from "@/lib/variants";
import { LeagueHeader } from "./LeagueHeader";
import { MarketView } from "./MarketView";
import { PaperView } from "./PaperView";
import { TableView } from "./TableView";

export function LeagueScreen({ view, lang }: { view: LeagueView; lang: Lang }) {
  const t = copyFor(lang).league;
  const { body } = view;
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <LeagueHeader view={view} lang={lang} />
      {body.kind === "market" ? <MarketView model={body.market} lang={lang} /> : null}
      {body.kind === "table" ? <TableView model={body.table} lang={lang} gw={view.gw ?? 0} /> : null}
      {body.kind === "paper" ? <PaperView model={body.paper} lang={lang} /> : null}
      {body.kind === "paper-soon" ? (
        <div className={panel()}>
          <p className={panelBody()}>{t.paperSoon}</p>
        </div>
      ) : null}
      {body.kind === "market-soon" ? (
        <div className={panel()}>
          <p className={panelBody()}>{t.marketSoon}</p>
          <Link href={`/league/${view.leagueId}/table`} className={button({ intent: "outline" })}>
            {t.seeTable}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
