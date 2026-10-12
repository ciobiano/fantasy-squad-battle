import { Suspense } from "react";
import { Players } from "@/components/screens/Players";
import { ListFallback } from "@/components/screens/fallbacks";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import type { InjuryFilter } from "@/lib/screens/tools";
import { INJURY_SAMPLE, SNAPSHOT_TAKEN_AT, TICKER_SAMPLE } from "@/lib/screens/tools-sample";
import { requestLang } from "@/lib/request";
import { page } from "@/lib/variants";

const STATUSES: readonly InjuryFilter[] = ["all", "injured", "doubtful", "suspended", "unavailable"];
const TEAMS = TICKER_SAMPLE.map((row) => row.team.short).sort();

// Reads the 12 Oct snapshot until lib/tools (data session) provides the live list.
// Ages are measured from the snapshot, so they stay true to the data shown.
async function PlayersForRequest({ searchParams }: { searchParams: PageProps<"/players">["searchParams"] }) {
  const [lang, query] = await Promise.all([requestLang(), searchParams]);
  const status = STATUSES.find((s) => s === query.status) ?? "all";
  const team = TEAMS.find((t) => t === query.team) ?? null;
  return <Players rows={INJURY_SAMPLE} status={status} team={team} teams={TEAMS} now={Date.parse(SNAPSHOT_TAKEN_AT)} lang={lang} />;
}

export default function PlayersPage({ searchParams }: PageProps<"/players">) {
  return (
    <main className={page()}>
      <Sky height="players" />
      <Suspense fallback={<ListFallback />}>
        <PlayersForRequest searchParams={searchParams} />
      </Suspense>
      <TabBar active="players" />
    </main>
  );
}
