// The story viewer (/league/{id}/story/{card}): the Wrap first, then every
// award that has a winner, in story order. Each card carries its page link and
// its image in both formats and both themes, so the viewer can show the one
// that matches the app's theme and share the size the person picks.
import { SAMPLE_LEAGUE, fplId } from "@/lib/ids";
import type { Lang } from "@/lib/i18n";
import { FORMATS, THEMES } from "@/lib/cards/query";
import { cardUrl, type CardKey } from "@/lib/cards/request";
import type { CardFormat, CardTheme } from "@/lib/cards/types";
import { liveLeague, type LeagueSource } from "./league";
import { SAMPLE_MARKET, storyHref, type MarketData } from "./market";
import { guard, notFound, ready, redirectTo, type Screen } from "./screen";

export type CardImages = Readonly<Record<CardFormat, Readonly<Record<CardTheme, string>>>>;

export interface StoryCard {
  readonly key: CardKey;
  /** This card's story page. */
  readonly href: string;
  readonly images: CardImages;
}

export interface StoryView {
  readonly leagueId: string;
  readonly leagueName: string;
  readonly gw: number;
  readonly cards: readonly StoryCard[];
  /** The card the link opened. */
  readonly index: number;
  readonly closeHref: string;
}

function storyView(leagueId: string, market: MarketData, lang: Lang): Omit<StoryView, "index"> {
  const images = (key: CardKey): CardImages =>
    Object.fromEntries(
      FORMATS.map((format) => [format, Object.fromEntries(THEMES.map((theme) => [theme, cardUrl(leagueId, market.gw, key, { format, theme, lang })]))]),
    ) as CardImages;
  const keys: readonly CardKey[] = ["wrap", ...market.awards];
  return {
    leagueId,
    leagueName: market.leagueName,
    gw: market.gw,
    cards: keys.map((key) => ({ key, href: storyHref(leagueId, key), images: images(key) })),
    closeHref: `/league/${leagueId}`,
  };
}

/** A card that isn't in this gameweek's stories is a 404; a league without stories yet goes back to its page. */
export async function loadStory(
  leagueSegment: string,
  cardSegment: string,
  lang: Lang,
  source: LeagueSource = liveLeague,
): Promise<Screen<StoryView>> {
  const open = (view: Omit<StoryView, "index">): Screen<StoryView> => {
    const index = view.cards.findIndex((card) => card.key === cardSegment);
    return index < 0 ? notFound() : ready({ ...view, index });
  };
  if (leagueSegment === SAMPLE_LEAGUE) return open(storyView(SAMPLE_LEAGUE, SAMPLE_MARKET, lang));
  const leagueId = fplId(leagueSegment);
  if (leagueId === null) return notFound();
  return guard("story", `/league/${leagueId}/story/${cardSegment}`, async () => {
    const market = await source.market(leagueId);
    return market ? open(storyView(String(leagueId), market, lang)) : redirectTo(`/league/${leagueId}`);
  });
}
