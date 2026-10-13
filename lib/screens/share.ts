// The public share page (/s/{league}/{gw}): the Wrapped card, every award card,
// the standings and a way in for whoever followed the link. Its link previews
// on WhatsApp and X with the dark, square Wrapped card (Ralph, 13 Oct).
import type { AwardKey } from "@/lib/awards";
import { cardUrl } from "@/lib/cards/request";
import type { Lang } from "@/lib/i18n";
import { SAMPLE_LEAGUE, fplId, gameweekNumber } from "@/lib/ids";
import { liveLeague, type LeagueSource } from "./league";
import { SAMPLE_MARKET, storyHref, type MarketData } from "./market";
import { guard, notFound, ready, redirectTo, type Screen } from "./screen";
import { cardImages, type CardImages } from "./story";
import { SAMPLE_TABLE, tableView, type TableView } from "./table";

export interface ShareCard {
  /** Opens this card in the story viewer. */
  readonly href: string;
  readonly images: CardImages["x"];
}

export interface ShareView {
  readonly leagueId: string;
  readonly leagueName: string;
  readonly gw: number;
  readonly wrap: ShareCard;
  readonly awards: readonly (ShareCard & { readonly key: AwardKey })[];
  readonly table: TableView;
  /** Open Graph and X: the dark, square Wrapped card at full size. */
  readonly previewImage: string;
}

function shareView(leagueId: string, market: MarketData, table: TableView, lang: Lang): ShareView {
  const card = (key: AwardKey | "wrap"): ShareCard => ({
    href: storyHref(leagueId, key),
    images: cardImages(leagueId, market.gw, key, lang).x,
  });
  return {
    leagueId,
    leagueName: market.leagueName,
    gw: market.gw,
    wrap: card("wrap"),
    awards: market.awards.map((key) => ({ key, ...card(key) })),
    table,
    previewImage: cardUrl(leagueId, market.gw, "wrap", { format: "x", theme: "dark", lang }),
  };
}

/** Only the gameweek the league's awards are for has a page, until older gameweeks are wired in. */
export async function loadSharePage(
  leagueSegment: string,
  gwSegment: string,
  lang: Lang,
  source: LeagueSource = liveLeague,
): Promise<Screen<ShareView>> {
  const gw = gameweekNumber(gwSegment);
  if (gw === null) return notFound();
  if (leagueSegment === SAMPLE_LEAGUE) {
    return gw === SAMPLE_MARKET.gw ? ready(shareView(SAMPLE_LEAGUE, SAMPLE_MARKET, SAMPLE_TABLE, lang)) : notFound();
  }
  const leagueId = fplId(leagueSegment);
  if (leagueId === null) return notFound();
  return guard("share", `/s/${leagueId}/${gw}`, async () => {
    const [market, standings] = await Promise.all([source.market(leagueId), source.standings(leagueId)]);
    if (!market || !standings) return redirectTo(`/league/${leagueId}`);
    return market.gw === gw ? ready(shareView(String(leagueId), market, tableView(standings, null), lang)) : notFound();
  });
}
