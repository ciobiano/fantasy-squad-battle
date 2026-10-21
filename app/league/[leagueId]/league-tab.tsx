// The League routes (Market, Table, On paper) render through here; only the tab,
// its loader and the sky's height differ.
import { headers } from "next/headers";
import { Suspense } from "react";
import { LeagueFallback } from "@/components/screens/fallbacks";
import { LeagueScreen } from "@/components/screens/LeagueScreen";
import { settle } from "@/components/screens/settle";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { trackServer } from "@/lib/analytics/capture";
import { rememberedTeam, requestLang } from "@/lib/request";
import { loadLeague, type LeagueTab } from "@/lib/screens/league";
import { loadLeaguePaper } from "@/lib/screens/paper";
import { page } from "@/lib/variants";

type Params = Promise<{ readonly leagueId: string }>;

async function LeagueForRequest({ params, tab }: { params: Params; tab: LeagueTab }) {
  const [{ leagueId }, lang, team, head] = await Promise.all([params, requestLang(), rememberedTeam(), headers()]);
  const screen = tab === "paper" ? await loadLeaguePaper(leagueId, team) : await loadLeague(leagueId, tab, team);
  // On paper isn't one of the analytics views yet (lib/analytics/events.ts).
  if (tab !== "paper" && screen.kind === "ready" && screen.view.gw !== null) {
    trackServer("league_loaded", { league: screen.view.leagueId, gw: screen.view.gw, view: tab, language: lang }, head);
  }
  return settle(screen, lang, (view) => <LeagueScreen view={view} lang={lang} />);
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
