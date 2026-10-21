import { Suspense } from "react";
import { PlannerStart } from "@/components/screens/PlannerStart";
import { StartFallback } from "@/components/screens/fallbacks";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { requestLang } from "@/lib/request";
import { plannerStartView } from "@/lib/screens/planner";
import { page } from "@/lib/variants";

// The Planner tab before a team ID. With a remembered team, the proxy opens
// that team's rating instead (lib/remembered.ts), unless the link says ?start=1.
async function StartForRequest({ searchParams }: { searchParams: PageProps<"/planner">["searchParams"] }) {
  const [lang, query] = await Promise.all([requestLang(), searchParams]);
  return <PlannerStart view={plannerStartView(query)} lang={lang} />;
}

export default function PlannerStartPage({ searchParams }: PageProps<"/planner">) {
  return (
    <main className={page()}>
      <Sky height="planner" />
      <Suspense fallback={<StartFallback />}>
        <StartForRequest searchParams={searchParams} />
      </Suspense>
      <TabBar active="planner" />
    </main>
  );
}
