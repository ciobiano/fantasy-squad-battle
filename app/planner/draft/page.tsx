import { Suspense } from "react";
import { DraftBoard } from "@/components/screens/DraftBoard";
import { RatingFallback } from "@/components/screens/fallbacks";
import { settle } from "@/components/screens/settle";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { requestLang } from "@/lib/request";
import { loadDraft } from "@/lib/screens/planner";
import { page } from "@/lib/variants";

// Draft from scratch. The server sends every player, the rules and the
// fixtures once; the picks are made and kept in the browser (DraftBoard).
async function DraftForRequest() {
  const lang = await requestLang();
  return settle(await loadDraft(), lang, (view) => <DraftBoard view={view} lang={lang} />);
}

export default function DraftPage() {
  return (
    <main className={page()}>
      <Sky height="rating" />
      <Suspense fallback={<RatingFallback />}>
        <DraftForRequest />
      </Suspense>
      <TabBar active="planner" />
    </main>
  );
}
