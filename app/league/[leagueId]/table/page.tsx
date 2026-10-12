import { LeagueTabPage } from "../league-tab";

export default function LeagueTablePage({ params }: PageProps<"/league/[leagueId]/table">) {
  return <LeagueTabPage params={params} tab="table" />;
}
