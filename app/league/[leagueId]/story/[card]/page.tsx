import { headers } from "next/headers";
import { Suspense } from "react";
import { settle } from "@/components/screens/settle";
import { Story } from "@/components/screens/Story";
import { trackServer } from "@/lib/analytics/capture";
import { requestLang } from "@/lib/request";
import { loadStory } from "@/lib/screens/story";
import { storyViewer } from "@/lib/variants";

async function StoryForRequest({ params }: { params: PageProps<"/league/[leagueId]/story/[card]">["params"] }) {
  const [{ leagueId, card }, lang, head] = await Promise.all([params, requestLang(), headers()]);
  const screen = await loadStory(leagueId, card, lang);
  if (screen.kind === "ready") {
    // The card the link opened; cards played after it change in place and aren't counted.
    const { view } = screen;
    trackServer("card_viewed", { league: view.leagueId, gw: view.gw, award: view.cards[view.index].key, language: lang }, head);
  }
  return settle(screen, lang, (view) => <Story view={view} lang={lang} />);
}

export default function StoryPage({ params }: PageProps<"/league/[leagueId]/story/[card]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className={storyViewer()} />}>
      <StoryForRequest params={params} />
    </Suspense>
  );
}
