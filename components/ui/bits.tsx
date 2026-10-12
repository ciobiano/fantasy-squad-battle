// Small shared pieces: team badge, rank pill, award emoji, FPL-down panel.
import Image from "next/image";
import Link from "next/link";
import type { AwardKey } from "@/lib/cards/types";
import type { Badge } from "@/lib/ui/badge";
import type { Movement } from "@/lib/ui/format";
import { badge, button, panel, panelBody, panelTitle, rankPill, visuallyHidden } from "@/lib/variants";
import { OfflineIcon } from "./icons";

export function TeamBadge({ value, size = "md" }: { value: Badge; size?: "sm" | "md" | "lg" }) {
  return (
    <span aria-hidden="true" className={badge({ colour: value.colour, shape: value.shape, size })}>
      {value.initials}
    </span>
  );
}

/** ▲ green, ▼ red, 0 grey; the glyph or number is always there, so colour is never the only signal. */
export function RankPill({ move, showPlaces = true, words }: { move: Movement; showPlaces?: boolean; words: string }) {
  const glyph = move.direction === "up" ? "▲" : move.direction === "down" ? "▼" : "";
  const text = move.direction === "none" ? "0" : `${glyph}${showPlaces ? move.places : ""}`;
  return (
    <>
      <span aria-hidden="true" className={rankPill({ direction: move.direction })}>
        {text}
      </span>
      <span className={visuallyHidden()}>{words}</span>
    </>
  );
}

const EMOJI_FILE: Record<AwardKey, string> = {
  oga: "1f451", climber: "1f4c8", captain: "1fae0", bench: "1fa91",
  hits: "1f4b8", middle: "1f6cb", faller: "1f4c9", spoon: "1f944",
};

/** Award emoji from the bundled Noto set (never the platform's), the same art as the cards. */
export function AwardEmoji({ award, size = 28 }: { award: AwardKey; size?: number }) {
  return <Image src={`/emoji/emoji_u${EMOJI_FILE[award]}.svg`} alt="" width={size} height={size} unoptimized />;
}

export function DownPanel({ title, body, retry, retryHref }: { title: string; body: string; retry: string; retryHref: string }) {
  return (
    <div role="alert" className={panel()}>
      <span className={panelTitle()}>
        <OfflineIcon />
        {title}
      </span>
      <p className={panelBody()}>{body}</p>
      <Link href={retryHref} className={button({ intent: "outline" })}>
        {retry}
      </Link>
    </div>
  );
}
