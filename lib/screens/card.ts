// A share card's model, for /cards/{league}/{gw}/{wrap|award}: the sample
// league's from the design canvas, a real league's from its league view, with
// its roast line (lib/roasts) in the card's language.
import type { CardModel } from "@/lib/cards/render";
import type { CardRequest } from "@/lib/cards/request";
import { SAMPLE_GW, sampleAward, sampleWrap } from "@/lib/cards/sample";
import { SAMPLE_LEAGUE, fplId } from "@/lib/ids";
import { cardFromView } from "./from-view";
import { liveLeague, type LeagueSource } from "./league";
import { guard, notFound, ready, type Screen } from "./screen";

function sampleCard({ kind, provisional, options }: CardRequest): CardModel {
  return kind.kind === "wrap"
    ? { kind: "wrap", model: sampleWrap(provisional) }
    : { kind: "award", model: sampleAward(kind.award, options.lang, provisional) };
}

/** No card for an unknown league, a gameweek without awards yet, or an award nobody won. */
export async function loadCard(request: CardRequest, source: LeagueSource = liveLeague): Promise<Screen<CardModel>> {
  if (request.league === SAMPLE_LEAGUE) return request.gw === SAMPLE_GW ? ready(sampleCard(request)) : notFound();
  const leagueId = fplId(request.league);
  if (leagueId === null) return notFound();
  return guard("card", `/cards/${leagueId}/${request.gw}`, async () => {
    const result = await source.view(leagueId, { gw: request.gw });
    if (!result.ok) return notFound();
    const key = request.kind.kind === "wrap" ? "wrap" : request.kind.award;
    const card = cardFromView(result.data, key, request.options.lang);
    return card ? ready(card) : notFound();
  });
}
