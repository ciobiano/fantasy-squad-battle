import { Suspense } from "react";
import { Start } from "@/components/screens/Start";
import { Sky } from "@/components/ui/Sky";
import type { StartMode } from "@/lib/fpl/start-input";
import { START_ERRORS } from "@/lib/i18n";
import { requestLang } from "@/lib/request";
import { column, page, skeleton } from "@/lib/variants";

// "/" opens the remembered league straight away (proxy.ts); this is Start for
// everyone else, and for "Change team" / errors (?start=1).

async function StartForRequest({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [lang, query] = await Promise.all([requestLang(), searchParams]);
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const mode: StartMode = one(query.mode) === "league" ? "league" : "team";
  const error = START_ERRORS.find((e) => e === one(query.error)) ?? null;
  return <Start lang={lang} mode={mode} value={one(query.q).slice(0, 300)} error={error} />;
}

function StartFallback() {
  return (
    <div aria-busy="true" className={column({ gap: "md" })}>
      <div className={skeleton({ shape: "block" })} />
      <div className={skeleton({ shape: "row" })} />
    </div>
  );
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
