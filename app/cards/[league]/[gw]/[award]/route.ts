import type { NextRequest } from "next/server";
import { renderCard } from "@/lib/cards/render";
import { cardRequest } from "@/lib/cards/request";
import { loadCard } from "@/lib/screens/card";

// A share card as a PNG: /cards/{league}/{gw}/{wrap|award}?format=status|x&theme=dark|light&lang=pcm|en|fr
export async function GET(request: NextRequest, ctx: RouteContext<"/cards/[league]/[gw]/[award]">) {
  const card = cardRequest(await ctx.params, request.nextUrl.searchParams);
  const screen = card ? await loadCard(card) : null;
  if (card && screen?.kind === "ready") return renderCard(screen.view, card.options);
  if (screen?.kind === "down") return new Response("FPL isn't answering", { status: 503, headers: { "Retry-After": "60" } });
  return new Response("Not found", { status: 404 });
}
