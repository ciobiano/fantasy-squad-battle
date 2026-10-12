// A share card's model, for /cards/{league}/{gw}/{wrap|award}. Only the sample
// league has cards until the award logic (lib/league) lands; then this is the
// one place that changes.
import type { CardModel } from "@/lib/cards/render";
import type { CardRequest } from "@/lib/cards/request";
import { SAMPLE_GW, sampleAward, sampleWrap } from "@/lib/cards/sample";
import { SAMPLE_LEAGUE } from "@/lib/ids";
import { notFound, ready, type Screen } from "./screen";

export async function loadCard(request: CardRequest): Promise<Screen<CardModel>> {
  if (request.league !== SAMPLE_LEAGUE || request.gw !== SAMPLE_GW) return notFound();
  const { kind, provisional, options } = request;
  return ready(
    kind.kind === "wrap"
      ? { kind: "wrap", model: sampleWrap(provisional) }
      : { kind: "award", model: sampleAward(kind.award, options.lang, provisional) },
  );
}
