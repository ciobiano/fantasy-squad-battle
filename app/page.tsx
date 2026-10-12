import { Suspense } from "react";
import { StartFallback } from "@/components/screens/fallbacks";
import { Start } from "@/components/screens/Start";
import { Sky } from "@/components/ui/Sky";
import { requestLang } from "@/lib/request";
import { startView } from "@/lib/screens/start";
import { page } from "@/lib/variants";

// "/" opens the remembered league straight away (proxy.ts); this is Start for
// everyone else, and for "Change team" / errors (?start=1).
async function StartForRequest({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [lang, query] = await Promise.all([requestLang(), searchParams]);
  return <Start view={startView(query)} lang={lang} />;
}

export default function StartPage({ searchParams }: PageProps<"/">) {
  return (
    <main className={page({ tabs: false })}>
      <Sky height="start" />
      <Suspense fallback={<StartFallback />}>
        <StartForRequest searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
