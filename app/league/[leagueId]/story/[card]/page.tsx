import { Suspense } from "react";
import { settle } from "@/components/screens/settle";
import { Story } from "@/components/screens/Story";
import { requestLang } from "@/lib/request";
import { loadStory } from "@/lib/screens/story";
import { storyViewer } from "@/lib/variants";

async function StoryForRequest({ params }: { params: PageProps<"/league/[leagueId]/story/[card]">["params"] }) {
  const [{ leagueId, card }, lang] = await Promise.all([params, requestLang()]);
  return settle(await loadStory(leagueId, card, lang), lang, (view) => <Story view={view} lang={lang} />);
}

export default function StoryPage({ params }: PageProps<"/league/[leagueId]/story/[card]">) {
  return (
    <Suspense fallback={<div aria-busy="true" className={storyViewer()} />}>
      <StoryForRequest params={params} />
    </Suspense>
  );
}
