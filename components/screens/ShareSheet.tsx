"use client";

// Share a card: WhatsApp Status (tall picture), X (square picture) or Save
// image (both sizes), in the theme the page is showing. The sharing itself is
// the data session's lib/share; this is the sheet around it.
//
// On a phone the picture goes to the phone's own share sheet ALONE: with text
// or a link beside it, WhatsApp on iPhone keeps the link and drops the picture.
// WhatsApp then offers "My status", and X opens its composer with the picture.
// Where a browser can't share pictures (most computers) it downloads instead,
// and for X the composer opens with the league's page. No website can post
// straight into Status or X; the phone's share sheet is as close as it gets.
//
// With no JavaScript the sheet is a <details> of download links.
import Link from "next/link";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { track } from "@/lib/analytics/client";
import type { EventProps } from "@/lib/analytics/events";
import type { CardImages } from "@/lib/screens/story";
import { browserShareEnv, createImageCache, shareCard } from "@/lib/share/share";
import {
  sheet, sheetBackdrop, sheetCancel, sheetGrabber, sheetIcon, sheetOption, sheetOptionSub, sheetOptionTitle, sheetStatus,
  sheetText, sheetTitle, storyShare, storyShareWrap, storyToast,
} from "@/lib/variants";
import { DownloadIcon, ShareIcon, WhatsAppMark, XMark } from "../ui/icons";
import { shownTheme } from "../ui/theme";

export interface ShareLabels {
  readonly share: string;
  readonly title: string;
  readonly status: string;
  readonly statusSub: string;
  readonly x: string;
  readonly xSub: string;
  readonly save: string;
  readonly saveSub: string;
  readonly cancel: string;
  readonly tapAgain: string;
  readonly failed: string;
  readonly saved: string;
  readonly savedForX: string;
}

/** What a share or a download is counted with: the card, never the person. */
export type ShareCount = Omit<EventProps["card_shared"], "format">;

interface ShareSheetProps {
  readonly images: CardImages;
  readonly count: ShareCount;
  /** e.g. "squad-battle-gw5-oga"; the format is added. */
  readonly filename: string;
  /** Where Cancel goes with no JavaScript: this card's page. */
  readonly cardHref: string;
  /** The league's public page: X's composer opens with it on a computer. */
  readonly pageHref: string;
  readonly labels: ShareLabels;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

type CardFormat = keyof CardImages;
type CardTheme = keyof CardImages[CardFormat];
type Option = "status" | "x" | "save";

const OPTIONS: readonly Option[] = ["status", "x", "save"];
const THEMES: readonly CardTheme[] = ["light", "dark"];
const ICON: Record<Option, ReactNode> = { status: <WhatsAppMark />, x: <XMark />, save: <DownloadIcon /> };
/** How long "Saved" stays up after the sheet closes. */
const TOAST_MS = 4000;

export function ShareSheet({ images, count, filename, cardHref, pageHref, labels, open, onOpenChange }: ShareSheetProps) {
  const [note, setNote] = useState<"tapAgain" | "failed" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // One cache per sheet: the pictures arrive before the tap (lib/share).
  const [cache] = useState(createImageCache);

  // Fetch both pictures when the sheet opens, so the tap can open the phone's share sheet at once.
  useEffect(() => {
    if (!open) return;
    const theme = shownTheme();
    for (const format of ["status", "x"] as const) cache.prefetch(images[format][theme]);
  }, [open, images, cache]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const name = (format: CardFormat) => `${filename}-${format}.png`;

  const close = (saved: string | null) => {
    setNote(null);
    onOpenChange(false);
    if (saved) setToast(saved);
  };

  const choose = (option: Option, theme: CardTheme) => async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const env = browserShareEnv();
    if (option === "save") {
      env.download(images.status[theme], name("status"));
      env.download(images.x[theme], name("x"));
      track("card_downloaded", { ...count, format: "both" });
      close(labels.saved);
      return;
    }
    const pageUrl = new URL(pageHref, window.location.origin).href;
    const outcome = await shareCard({ url: images[option][theme], filename: name(option), target: option, pageUrl }, cache, env);
    if (outcome === "shared") {
      track("card_shared", { ...count, format: option });
      close(null);
    } else if (outcome === "downloaded") {
      track("card_downloaded", { ...count, format: option });
      close(option === "x" ? labels.savedForX : labels.saved);
    } else if (outcome === "tap-again") setNote("tapAgain");
    else if (outcome === "failed") setNote("failed");
  };

  const text: Record<Option, readonly [string, string]> = {
    status: [labels.status, labels.statusSub],
    x: [labels.x, labels.xSub],
    save: [labels.save, labels.saveSub],
  };

  return (
    <>
      <details
        open={open}
        onToggle={(event) => {
          if (!event.currentTarget.open) setNote(null);
          onOpenChange(event.currentTarget.open);
        }}
        className={storyShareWrap()}
      >
        <summary className={storyShare()}>
          <ShareIcon />
          {labels.share}
        </summary>
        <div aria-hidden="true" className={sheetBackdrop()} onClick={() => close(null)} />
        <div role="dialog" aria-modal="true" aria-labelledby="share-title" className={sheet()}>
          <span aria-hidden="true" className={sheetGrabber()} />
          <h2 id="share-title" className={sheetTitle()}>
            {labels.title}
          </h2>
          <p role="status" className={sheetStatus({ tone: note === "failed" ? "alert" : "info" })}>
            {note ? labels[note] : null}
          </p>
          {OPTIONS.flatMap((option) =>
            // One row per theme: with no JavaScript, CSS shows the one whose link fits the page's theme.
            THEMES.map((theme) => (
              <a
                key={`${option}-${theme}`}
                href={images[option === "save" ? "status" : option][theme]}
                download={name(option === "x" ? "x" : "status")}
                onClick={choose(option, theme)}
                className={sheetOption({ theme })}
              >
                <span aria-hidden="true" className={sheetIcon()}>
                  {ICON[option]}
                </span>
                <span className={sheetText()}>
                  <span className={sheetOptionTitle()}>{text[option][0]}</span>
                  <span className={sheetOptionSub()}>{text[option][1]}</span>
                </span>
              </a>
            )),
          )}
          <Link
            href={cardHref}
            onClick={(event) => {
              event.preventDefault();
              close(null);
            }}
            className={sheetCancel()}
          >
            {labels.cancel}
          </Link>
        </div>
      </details>
      <p role="status" className={storyToast()}>
        {toast}
      </p>
    </>
  );
}
