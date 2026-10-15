import { Suspense } from "react";
import { PickerFallback } from "@/components/screens/fallbacks";
import { Picker } from "@/components/screens/Picker";
import { settle } from "@/components/screens/settle";
import { Sky } from "@/components/ui/Sky";
import { requestLang } from "@/lib/request";
import { loadPicker } from "@/lib/screens/picker";
import { page } from "@/lib/variants";

async function PickerForRequest({ params }: { params: PageProps<"/team/[teamId]">["params"] }) {
  const [{ teamId }, lang] = await Promise.all([params, requestLang()]);
  return settle(await loadPicker(teamId), lang, (view) => <Picker view={view} lang={lang} />);
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
