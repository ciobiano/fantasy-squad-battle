import { Suspense } from "react";
import { ListFallback } from "@/components/screens/fallbacks";
import { Fixtures } from "@/components/screens/Fixtures";
import { settle } from "@/components/screens/settle";
import { Sky } from "@/components/ui/Sky";
import { TabBar } from "@/components/ui/TabBar";
import { requestLang } from "@/lib/request";
import { loadFixtures } from "@/lib/screens/fixtures";
import { page } from "@/lib/variants";

async function FixturesForRequest({ searchParams }: { searchParams: PageProps<"/fixtures">["searchParams"] }) {
  const [lang, query] = await Promise.all([requestLang(), searchParams]);
  return settle(await loadFixtures(query), lang, (view) => <Fixtures view={view} lang={lang} />);
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
