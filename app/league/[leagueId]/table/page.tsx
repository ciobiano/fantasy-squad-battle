import { Suspense } from "react";
import { LeagueScreen } from "@/components/screens/LeagueScreen";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { LeagueFallback } from "@/components/screens/fallbacks";
import { page } from "@/lib/variants";

async function TableForRequest({ params }: { params: PageProps<"/league/[leagueId]/table">["params"] }) {
  const { leagueId } = await params;
  return <LeagueScreen leagueId={leagueId} view="table" />;
}

export default function LeagueTablePage({ params }: PageProps<"/league/[leagueId]/table">) {
  return (
    <main className={page()}>
      <Sky height="picker" />
      <Suspense fallback={<LeagueFallback />}>
        <TableForRequest params={params} />
      </Suspense>
      <TabBar active="league" />
    </main>
  );
}
