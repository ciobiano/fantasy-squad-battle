import { LeagueTabPage } from "../league-tab";

export default function LeaguePaperPage({ params }: PageProps<"/league/[leagueId]/paper">) {
  return <LeagueTabPage params={params} tab="paper" />;
}
