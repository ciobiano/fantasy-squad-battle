import { Suspense } from "react";
import { Start } from "@/components/screens/Start";
import { Sky } from "@/components/ui/Sky";
import type { StartMode } from "@/lib/fpl/start-input";
import { COPY, type StartError } from "@/lib/ui/copy";
import { requestLang } from "@/lib/ui/request";
import { column, page, skeleton } from "@/lib/variants";

// "/" opens the remembered league straight away (proxy.ts); this is Start for
// everyone else, and for "Change team" / errors (?start=1).
const ERRORS = Object.keys(COPY.en.start.errors) as StartError[];

async function StartForRequest({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [lang, query] = await Promise.all([requestLang(), searchParams]);
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const mode: StartMode = one(query.mode) === "league" ? "league" : "team";
  const error = ERRORS.find((e) => e === one(query.error)) ?? null;
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
