// Both League routes (Market and Table) render through here; only the tab and
// the sky's height differ.
import { Suspense } from "react";
import { LeagueFallback } from "@/components/screens/fallbacks";
import { LeagueScreen } from "@/components/screens/LeagueScreen";
import { settle } from "@/components/screens/settle";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { rememberedTeam, requestLang } from "@/lib/request";
import { loadLeague, type LeagueTab } from "@/lib/screens/league";
import { page } from "@/lib/variants";

type Params = Promise<{ readonly leagueId: string }>;

async function LeagueForRequest({ params, tab }: { params: Params; tab: LeagueTab }) {
  const [{ leagueId }, lang, team] = await Promise.all([params, requestLang(), rememberedTeam()]);
  return settle(await loadLeague(leagueId, tab, team), lang, (view) => <LeagueScreen view={view} lang={lang} />);
}

export function LeagueTabPage({ params, tab }: { params: Params; tab: LeagueTab }) {
  return (
    <main className={page()}>
      <Sky height={tab === "market" ? "league" : "picker"} />
      <Suspense fallback={<LeagueFallback />}>
        <LeagueForRequest params={params} tab={tab} />
      </Suspense>
      <TabBar active="league" />
    </main>
  );
}
