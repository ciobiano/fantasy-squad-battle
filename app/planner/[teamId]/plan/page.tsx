import { Suspense } from "react";
import { PlanBoard } from "@/components/screens/PlanBoard";
import { RatingFallback } from "@/components/screens/fallbacks";
import { settle } from "@/components/screens/settle";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { requestLang } from "@/lib/request";
import { loadPlan } from "@/lib/screens/planner";
import { page } from "@/lib/variants";

type Props = PageProps<"/planner/[teamId]/plan">;

// The plan board. The server sends the squad, players and fixtures once; every
// change after that runs in the browser (components/screens/PlanBoard.tsx).
async function PlanForRequest({ params, searchParams }: Props) {
  const [{ teamId }, query, lang] = await Promise.all([params, searchParams, requestLang()]);
  return settle(await loadPlan(teamId, query), lang, (view) => <PlanBoard view={view} lang={lang} />);
}

export default function PlanPage({ params, searchParams }: Props) {
  return (
    <main className={page()}>
      <Sky height="rating" />
      <Suspense fallback={<RatingFallback />}>
        <PlanForRequest params={params} searchParams={searchParams} />
      </Suspense>
      <TabBar active="planner" />
    </main>
  );
}
