import { Suspense } from "react";
import { ListFallback } from "@/components/screens/fallbacks";
import { Players } from "@/components/screens/Players";
import { settle } from "@/components/screens/settle";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { requestLang } from "@/lib/request";
import { loadPlayers } from "@/lib/screens/players";
import { page } from "@/lib/variants";

async function PlayersForRequest({ searchParams }: { searchParams: PageProps<"/players">["searchParams"] }) {
  const [lang, query] = await Promise.all([requestLang(), searchParams]);
  return settle(await loadPlayers(query), lang, (view) => <Players view={view} lang={lang} />);
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
