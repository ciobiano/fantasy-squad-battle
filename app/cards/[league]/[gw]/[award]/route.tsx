import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { CARD_HEIGHT, CARD_WIDTH } from "@/lib/cards/geometry";
import { CARD_FONTS } from "@/lib/cards/render/assets";
import { AwardCard } from "@/lib/cards/render/AwardCard";
import { WrapCard } from "@/lib/cards/render/WrapCard";
import { cacheControl, cardKind, cardOptions, gameweek } from "@/lib/cards/request";
import { SAMPLE_GW, SAMPLE_LEAGUE_ID, sampleAward, sampleWrap } from "@/lib/cards/sample";

// A share card as a PNG: /cards/{league}/{gw}/{wrap|award}?format=status|x&theme=dark|light&lang=pcm|en|fr
// Only the sample league renders until the award logic (lib/league) is wired in.
export async function GET(request: NextRequest, ctx: RouteContext<"/cards/[league]/[gw]/[award]">) {
  const { league, gw: gwSegment, award: awardSegment } = await ctx.params;
  const gw = gameweek(gwSegment);
  const kind = cardKind(awardSegment);
  if (gw === null || kind === null) return new Response("Not found", { status: 404 });
  if (league !== SAMPLE_LEAGUE_ID || gw !== SAMPLE_GW) return new Response("Not found", { status: 404 });

  const query = request.nextUrl.searchParams;
  const options = cardOptions(query);
  const provisional = query.get("provisional") === "1";

  const element =
    kind.kind === "wrap" ? (
      <WrapCard model={sampleWrap(provisional)} options={options} />
    ) : (
      <AwardCard model={sampleAward(kind.award, options.lang, provisional)} options={options} />
    );

  try {
    return new ImageResponse(element, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT[options.format],
      fonts: CARD_FONTS,
      emoji: "noto",
      headers: { "Cache-Control": cacheControl(provisional) },
    });
  } catch (error) {
    console.error("card render failed", { league, gw, award: awardSegment, options, error });
    return new Response("Couldn't draw this card", { status: 500 });
  }
}
