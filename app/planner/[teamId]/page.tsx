import { Suspense } from "react";
import { RatingFallback } from "@/components/screens/fallbacks";
import { settle } from "@/components/screens/settle";
import { TeamRating } from "@/components/screens/TeamRating";
import { PaperRank, RankFallback, YourLeague } from "@/components/screens/YourLeague";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import type { Lang } from "@/lib/i18n";
import { rememberedLeague, requestLang } from "@/lib/request";
import { compareLeague, loadPaperRank, loadTeamRating, type CompareLeague } from "@/lib/screens/planner";
import { leagueFallback, page } from "@/lib/variants";

type Props = PageProps<"/planner/[teamId]">;

// "2nd best squad of 11": every squad in the league is rated, 1–3 s the first
// time, so it streams on its own and the rating never waits for it.
async function RankForRequest({ leagueId, teamId, lang }: { leagueId: number; teamId: number; lang: Lang }) {
  return <PaperRank rank={await loadPaperRank(leagueId, teamId)} lang={lang} />;
}

// The league picked with ?league=, else the remembered one. Keyed by league,
// so a new pick shows the rank's placeholder rather than the old rank.
async function LeagueForRequest({ teamId, leagues, searchParams, lang }: { teamId: number; leagues: readonly CompareLeague[]; searchParams: Props["searchParams"]; lang: Lang }) {
  const [query, remembered] = await Promise.all([searchParams, rememberedLeague()]);
  const current = compareLeague(leagues, query.league, remembered);
  if (!current) return null;
  return (
    <YourLeague
      teamId={teamId}
      leagues={leagues}
      current={current}
      lang={lang}
      rank={
        <Suspense key={current.id} fallback={<RankFallback league={current.name} lang={lang} />}>
          <RankForRequest leagueId={current.id} teamId={teamId} lang={lang} />
        </Suspense>
      }
    />
  );
}

async function RatingForRequest({ params, searchParams }: Props) {
  const [{ teamId }, lang] = await Promise.all([params, requestLang()]);
  return settle(await loadTeamRating(teamId), lang, (view) => (
    <TeamRating
      view={view}
      lang={lang}
      league={
        view.kind === "rated" && view.leagues.length > 0 ? (
          <Suspense fallback={<div aria-hidden="true" className={leagueFallback()} />}>
            <LeagueForRequest teamId={view.team.id} leagues={view.leagues} searchParams={searchParams} lang={lang} />
          </Suspense>
        ) : null
      }
    />
  ));
}

export default function TeamRatingPage(props: Props) {
  return (
    <main className={page()}>
      <Sky height="rating" />
      <Suspense fallback={<RatingFallback />}>
        <RatingForRequest {...props} />
      </Suspense>
      <TabBar active="planner" />
    </main>
  );
}
