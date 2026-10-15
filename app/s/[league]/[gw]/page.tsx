import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { ListFallback } from "@/components/screens/fallbacks";
import { settle } from "@/components/screens/settle";
import { SharePage } from "@/components/screens/SharePage";
import { Sky } from "@/components/ui/Sky";
import { trackServer } from "@/lib/analytics/capture";
import { copyFor } from "@/lib/i18n";
import { requestLang } from "@/lib/request";
import { loadSharePage } from "@/lib/screens/share";
import { page } from "@/lib/variants";

type Props = PageProps<"/s/[league]/[gw]">;

// Link previews (WhatsApp, X): the league and gameweek, with the dark square Wrapped card.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ league, gw }, lang] = await Promise.all([params, requestLang()]);
  const screen = await loadSharePage(league, gw, lang);
  if (screen.kind !== "ready") return {};
  const { view } = screen;
  const s = copyFor(lang).sharePage;
  const title = s.metaTitle(view.leagueName, view.gw);
  const images = [{ url: view.previewImage, width: 1080, height: 1080, alt: copyFor(lang).card.wrapTitle(view.gw) }];
  return {
    title,
    description: s.metaDescription,
    openGraph: { title, description: s.metaDescription, type: "website", images },
    twitter: { card: "summary_large_image", title, description: s.metaDescription, images },
  };
}

async function ShareForRequest({ params }: { params: Props["params"] }) {
  const [{ league, gw }, lang, head] = await Promise.all([params, requestLang(), headers()]);
  const screen = await loadSharePage(league, gw, lang);
  if (screen.kind === "ready") {
    trackServer("league_loaded", { league: screen.view.leagueId, gw: screen.view.gw, view: "share", language: lang }, head);
  }
  return settle(screen, lang, (view) => <SharePage view={view} lang={lang} />);
}

export default function SharePageRoute({ params }: Props) {
  return (
    <main className={page({ tabs: false })}>
      <Sky height="picker" />
      <Suspense fallback={<ListFallback />}>
        <ShareForRequest params={params} />
      </Suspense>
    </main>
  );
}
