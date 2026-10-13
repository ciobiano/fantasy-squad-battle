"use client";

// The Market's story circles: the Wrap, then one per award. A circle turns grey
// once its card has been watched on this phone (the viewer marks it).
import Link from "next/link";
import type { MarketView } from "@/lib/screens/market";
import { story, storyFace, storyGap, storyRing, storyRow } from "@/lib/variants";
import { AwardEmoji } from "../ui/bits";
import { useWatched } from "../ui/watched";

interface StoryCirclesProps {
  readonly leagueId: string;
  readonly gw: number;
  readonly stories: MarketView["stories"];
  readonly label: string;
  /** Per story: the words under the circle, and its accessible name. */
  readonly captions: readonly string[];
  readonly names: readonly string[];
  /** The Wrap circle's face, e.g. "GW 5". */
  readonly wrapFace: string;
}

export function StoryCircles({ leagueId, gw, stories, label, captions, names, wrapFace }: StoryCirclesProps) {
  const watched = useWatched(leagueId, gw);
  return (
    <section aria-label={label} className={storyRow()}>
      {stories.map(({ key, href }, i) => (
        <Link key={key} href={href} aria-label={names[i]} className={story()}>
          <span className={storyRing({ watched: watched.has(key) })}>
            <span className={storyGap()}>
              {key === "wrap" ? (
                <span className={storyFace({ kind: "wrap" })}>{wrapFace}</span>
              ) : (
                <span className={storyFace({ kind: "award" })}>
                  <AwardEmoji award={key} />
                </span>
              )}
            </span>
          </span>
          {captions[i]}
        </Link>
      ))}
    </section>
  );
}
