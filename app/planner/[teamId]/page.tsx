import { Suspense } from "react";
import { RatingFallback } from "@/components/screens/fallbacks";
import { PaperLink } from "@/components/screens/PaperLink";
import { settle } from "@/components/screens/settle";
import { TeamRating } from "@/components/screens/TeamRating";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import type { Lang } from "@/lib/i18n";
import { rememberedLeague, requestLang } from "@/lib/request";
import { loadPaperRank, loadTeamRating } from "@/lib/screens/planner";
import { page } from "@/lib/variants";

type Params = PageProps<"/planner/[teamId]">["params"];

// "2nd of 11 on paper" in the remembered league: streamed on its own, so the
// rating never waits for every squad in the league.
async function PaperForRequest({ teamId, lang }: { teamId: number; lang: Lang }) {
  const rank = await loadPaperRank(await rememberedLeague(), teamId);
  return rank ? <PaperLink rank={rank} lang={lang} /> : null;
}

async function RatingForRequest({ params }: { params: Params }) {
  const [{ teamId }, lang] = await Promise.all([params, requestLang()]);
  return settle(await loadTeamRating(teamId), lang, (view) => (
    <TeamRating
      view={view}
      lang={lang}
      paper={
        view.kind === "rated" ? (
          <Suspense fallback={null}>
            <PaperForRequest teamId={view.team.id} lang={lang} />
          </Suspense>
        ) : null
      }
    />
  ));
}

export default function TeamRatingPage({ params }: PageProps<"/planner/[teamId]">) {
  return (
    <main className={page()}>
      <Sky height="rating" />
      <Suspense fallback={<RatingFallback />}>
        <RatingForRequest params={params} />
      </Suspense>
      <TabBar active="planner" />
    </main>
  );
}
