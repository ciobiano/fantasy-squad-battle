// The League tab for one league: header, then Market or Table.
// Real leagues: the Table comes from FPL's standings; the Market waits for
// lib/league (awards, gap series). The "sample" league shows both from the
// design canvas's sample data.
import Link from "next/link";
import { copyFor } from "@/lib/i18n";
import { notFound, redirect } from "next/navigation";
import { loadLeagueStandings, type LeagueStandings } from "@/lib/screens/league-data";
import { SAMPLE_MARKET } from "@/lib/screens/market";
import { SAMPLE_TABLE, tableView } from "@/lib/screens/table";
import { rememberedTeam, requestLang } from "@/lib/request";
import { button, column, panel, panelBody } from "@/lib/variants";
import { DownPanel } from "../ui/bits";
import { LeagueHeader } from "./LeagueHeader";
import { MarketView } from "./MarketView";
import { TableView } from "./TableView";

const LEAGUE_ID = /^\d{1,10}$/;

export async function LeagueScreen({ leagueId, view }: { leagueId: string; view: "market" | "table" }) {
  if (leagueId !== "sample" && !LEAGUE_ID.test(leagueId)) notFound();
  const [lang, team] = await Promise.all([requestLang(), rememberedTeam()]);
  const t = copyFor(lang);
  const changeHref = team !== null ? `/team/${team}` : "/?start=1&mode=league";

  if (leagueId === "sample") {
    const sample = SAMPLE_MARKET;
    return (
      <div lang={lang} className={column({ gap: "lg" })}>
        <LeagueHeader lang={lang} leagueId="sample" leagueName={sample.leagueName} gwLabel={view === "table" ? t.league.afterGameweek(sample.gw) : t.league.gameweek(sample.gw)} view={view} changeHref={changeHref} />
        {view === "market" ? <MarketView model={sample} lang={lang} /> : <TableView model={SAMPLE_TABLE} lang={lang} gw={sample.gw} />}
      </div>
    );
  }

  let loaded: LeagueStandings;
  try {
    loaded = await loadLeagueStandings(Number(leagueId));
  } catch (failure) {
    console.error("[league] FPL load failed", { leagueId, failure });
    return (
      <div lang={lang} className={column()}>
        <DownPanel title={t.down.title} body={t.down.body} retry={t.down.retry} retryHref={`/league/${leagueId}${view === "table" ? "/table" : ""}`} />
      </div>
    );
  }
  const { standings, gw } = loaded;
  if (standings === null) redirect(`/?start=1&mode=league&q=${leagueId}&error=league-not-found`);

  const model = tableView(standings, team);
  const gwLabel = gw === null ? "" : view === "table" ? t.league.afterGameweek(gw) : t.league.gameweek(gw);
  return (
    <div lang={lang} className={column({ gap: "lg" })}>
      <LeagueHeader lang={lang} leagueId={leagueId} leagueName={model.leagueName} gwLabel={gwLabel} view={view} changeHref={changeHref} />
      {view === "table" ? (
        <TableView model={model} lang={lang} gw={gw ?? 0} />
      ) : (
        <div className={panel()}>
          <p className={panelBody()}>{t.league.marketSoon}</p>
          <Link href={`/league/${leagueId}/table`} className={button({ intent: "outline" })}>
            {t.league.seeTable}
          </Link>
        </div>
      )}
    </div>
  );
}
