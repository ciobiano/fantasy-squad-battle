"use client";

// The story viewer, as on the canvas (S-Story): progress segments, close, the
// card with previous and next tap zones, Share and a visible Pause.
//
// With no JavaScript every control is a link: tap zones go to the previous or
// next card's page. With JavaScript, cards change in place (the URL follows),
// each plays for 5 s (the CSS animation on its segment), a press and hold
// pauses, and under reduced motion nothing advances on its own.
import { getImageProps } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { preload } from "react-dom";
import type { Lang } from "@/lib/i18n";
import type { StoryView } from "@/lib/screens/story";
import {
  storyBar, storyCard, storyClose, storyColumn, storyFill, storyPause, storySegment, storySegments, storyStage,
  storyTap, storyTop, storyViewer,
} from "@/lib/variants";
import { CardImage } from "../ui/CardImage";
import { CloseIcon, PauseIcon, PlayIcon } from "../ui/icons";
import { shownTheme } from "../ui/theme";
import { markWatched } from "../ui/watched";
import { ShareSheet, type ShareLabels } from "./ShareSheet";

export interface StoryLabels {
  readonly label: string;
  /** Per card: "Story 2 of 9". */
  readonly positions: readonly string[];
  /** Per card: its title, used as the image's alt text. */
  readonly titles: readonly string[];
  /** Per card: the share sheet's words, titled for that card. */
  readonly share: readonly ShareLabels[];
  readonly close: string;
  readonly previous: string;
  readonly next: string;
  readonly pause: string;
  readonly play: string;
}

/** A press longer than this pauses instead of moving on. */
const HOLD_MS = 250;
const SIZES = "(max-width: 448px) 92vw, 420px";
/** How many cards ahead start downloading. */
const PRELOAD_AHEAD = 2;

export function StoryPlayer({ view, labels, lang }: { view: StoryView; labels: StoryLabels; lang: Lang }) {
  const router = useRouter();
  const [index, setIndex] = useState(view.index);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [sharing, setSharing] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const wasHeld = useRef(false);

  const { cards, closeHref } = view;
  const card = cards[index];

  function go(to: number) {
    if (to >= cards.length) {
      router.push(closeHref);
      return;
    }
    const next = Math.max(0, to);
    setIndex(next);
    window.history.replaceState(null, "", cards[next].href);
  }

  useEffect(() => {
    markWatched(view.leagueId, view.gw, card.key);
  }, [view.leagueId, view.gw, card.key]);

  // The next cards start downloading while this one plays, in the theme on screen
  // (about 26 KB each), so quick taps don't wait.
  useEffect(() => {
    const theme = shownTheme();
    for (const next of cards.slice(index + 1, index + 1 + PRELOAD_AHEAD)) {
      const { props } = getImageProps({ src: next.preview[theme], alt: "", fill: true, sizes: SIZES });
      if (props.srcSet) preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: "low" });
    }
  }, [cards, index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (sharing) return;
      if (event.key === "ArrowRight") go(index + 1);
      else if (event.key === "ArrowLeft") go(index - 1);
      else if (event.key === "Escape") router.push(closeHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const press = () => {
    wasHeld.current = false;
    holdTimer.current = window.setTimeout(() => {
      wasHeld.current = true;
      setHeld(true);
    }, HOLD_MS);
  };
  const release = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHeld(false);
  };
  const tap = (to: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (wasHeld.current) {
      wasHeld.current = false; // the press was a hold: it paused, it doesn't move on
      return;
    }
    go(to);
  };

  return (
    <main
      data-theme="dark"
      data-paused={paused || held || sharing}
      aria-label={labels.label}
      className={storyViewer()}
    >
      <div className={storyColumn()}>
        <div
          role="progressbar"
          aria-label={labels.positions[index]}
          aria-valuemin={1}
          aria-valuemax={cards.length}
          aria-valuenow={index + 1}
          className={storySegments()}
        >
          {cards.map((c, i) => (
            <span key={c.key} className={storySegment()}>
              <span
                // A new key restarts the animation whenever this card becomes the active one.
                key={i === index ? `active-${index}` : "still"}
                onAnimationEnd={i === index ? () => go(index + 1) : undefined}
                className={storyFill({ state: i < index ? "done" : i === index ? "active" : "todo" })}
              />
            </span>
          ))}
        </div>

        <div className={storyTop()}>
          <Link href={closeHref} aria-label={labels.close} className={storyClose()}>
            <CloseIcon />
          </Link>
        </div>

        <div
          className={storyStage()}
          onPointerDown={press}
          onPointerUp={release}
          onPointerCancel={release}
          onPointerLeave={release}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className={storyCard()}>
            <CardImage key={card.key} images={card.preview} alt={labels.titles[index]} sizes={SIZES} main />
            <Link
              href={cards[index - 1]?.href ?? card.href}
              aria-label={labels.previous}
              draggable={false}
              onClick={tap(index - 1)}
              className={storyTap({ side: "previous" })}
            />
            <Link
              href={cards[index + 1]?.href ?? closeHref}
              aria-label={labels.next}
              draggable={false}
              onClick={tap(index + 1)}
              className={storyTap({ side: "next" })}
            />
          </div>
        </div>

        <div className={storyBar()}>
          <ShareSheet
            images={card.images}
            count={{ league: view.leagueId, gw: view.gw, award: card.key, language: lang }}
            filename={`squad-battle-gw${view.gw}-${card.key}`}
            cardHref={card.href}
            pageHref={view.pageHref}
            labels={labels.share[index]}
            open={sharing}
            onOpenChange={setSharing}
          />
          <button
            type="button"
            aria-label={paused ? labels.play : labels.pause}
            onClick={() => setPaused((p) => !p)}
            className={storyPause()}
          >
            {paused ? <PlayIcon /> : <PauseIcon />}
          </button>
        </div>
      </div>
    </main>
  );
}
