import { Suspense } from "react";
import { LeagueScreen } from "@/components/screens/LeagueScreen";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { LeagueFallback } from "@/components/screens/fallbacks";
import { page } from "@/lib/variants";

async function MarketForRequest({ params }: { params: PageProps<"/league/[leagueId]">["params"] }) {
  const { leagueId } = await params;
  return <LeagueScreen leagueId={leagueId} view="market" />;
}

export default function LeagueMarketPage({ params }: PageProps<"/league/[leagueId]">) {
  return (
    <main className={page()}>
      <Sky height="league" />
      <Suspense fallback={<LeagueFallback />}>
        <MarketForRequest params={params} />
      </Suspense>
      <TabBar active="league" />
    </main>
  );
}
