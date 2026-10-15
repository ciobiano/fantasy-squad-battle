import { LeagueTabPage } from "./league-tab";

export default function LeagueMarketPage({ params }: PageProps<"/league/[leagueId]">) {
  return <LeagueTabPage params={params} tab="market" />;
}
