import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Picker } from "@/components/screens/Picker";
import { DownPanel } from "@/components/ui/bits";
import { Sky } from "@/components/ui/Sky";
import { parseStartInput } from "@/lib/fpl/start-input";
import { getMyTeam, type MyTeamResult } from "@/lib/league/my-team";
import { pickerView } from "@/lib/screens/picker";
import { copyFor } from "@/lib/i18n";
import { requestLang } from "@/lib/ui/request";
import { column, page, skeleton } from "@/lib/variants";

async function PickerForRequest({ params }: { params: PageProps<"/team/[teamId]">["params"] }) {
  const [lang, { teamId }] = await Promise.all([requestLang(), params]);
  const input = parseStartInput(teamId, "team");
  if (!input.ok || input.kind !== "team") redirect(`/?start=1&mode=team&q=${encodeURIComponent(teamId)}&error=not-a-team`);

  let result: MyTeamResult;
  try {
    result = await getMyTeam(input.teamId);
  } catch (failure) {
    console.error("[picker] FPL load failed", { teamId: input.teamId, failure });
    const t = copyFor(lang).down;
    return (
      <div lang={lang} className={column()}>
        <DownPanel title={t.title} body={t.body} retry={t.retry} retryHref={`/team/${input.teamId}`} />
      </div>
    );
  }
  if (!result.ok) redirect(`/?start=1&mode=team&q=${input.teamId}&error=team-not-found`);
  return <Picker view={pickerView(result.data)} lang={lang} />;
}

function PickerFallback() {
  return (
    <div aria-busy="true" className={column({ gap: "md" })}>
      <div className={skeleton({ shape: "row" })} />
      <div className={skeleton({ shape: "block" })} />
      <div className={skeleton({ shape: "row" })} />
    </div>
  );
}

export default function TeamPage({ params }: PageProps<"/team/[teamId]">) {
  return (
    <main className={page({ tabs: false })}>
      <Sky height="picker" />
      <Suspense fallback={<PickerFallback />}>
        <PickerForRequest params={params} />
      </Suspense>
    </main>
  );
}
