import { Suspense } from "react";
import { Fixtures } from "@/components/screens/Fixtures";
import { ListFallback } from "@/components/screens/fallbacks";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { sortTicker } from "@/lib/screens/tools";
import { TICKER_SAMPLE } from "@/lib/screens/tools-sample";
import { requestLang } from "@/lib/request";
import { page } from "@/lib/variants";

// Reads the 12 Oct snapshot until lib/tools (data session) provides the live ticker.
async function FixturesForRequest({ searchParams }: { searchParams: PageProps<"/fixtures">["searchParams"] }) {
  const [lang, query] = await Promise.all([requestLang(), searchParams]);
  const sort = query.sort === "az" ? "az" : "easy";
  return <Fixtures rows={sortTicker(TICKER_SAMPLE, sort)} sort={sort} lang={lang} />;
}

export default function FixturesPage({ searchParams }: PageProps<"/fixtures">) {
  return (
    <main className={page()}>
      <Sky height="fixtures" />
      <Suspense fallback={<ListFallback />}>
        <FixturesForRequest searchParams={searchParams} />
      </Suspense>
      <TabBar active="fixtures" />
    </main>
  );
}
