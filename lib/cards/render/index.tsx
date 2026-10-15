// The card renderer's one entry point: a card model and options in, a PNG
// response out. Satori's needs (sizes, bundled fonts and emoji, inline styles)
// stay inside this folder.
import { ImageResponse } from "next/og";
import { CARD_HEIGHT, CARD_WIDTH } from "../geometry";
import { cacheControl } from "../request";
import type { AwardCardModel, CardOptions, WrapCardModel } from "../types";
import { CARD_FONTS } from "./assets";
import { AwardCard } from "./AwardCard";
import { WrapCard } from "./WrapCard";

export type CardModel =
  | { readonly kind: "wrap"; readonly model: WrapCardModel }
  | { readonly kind: "award"; readonly model: AwardCardModel };

/** Cached at the edge by whether the gameweek is final. A render failure is a 500, logged. */
export function renderCard(card: CardModel, options: CardOptions): Response {
  const element =
    card.kind === "wrap" ? <WrapCard model={card.model} options={options} /> : <AwardCard model={card.model} options={options} />;
  try {
    return new ImageResponse(element, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT[options.format],
      fonts: CARD_FONTS,
      emoji: "noto",
      headers: { "Cache-Control": cacheControl(card.model.meta.provisional) },
    });
  } catch (error) {
    console.error("[card] render failed", { kind: card.kind, options, error });
    return new Response("Couldn't draw this card", { status: 500 });
  }
}
