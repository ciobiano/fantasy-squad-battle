"use client";

// Share a card: WhatsApp Status (tall), X (square) or Save image (both sizes),
// in the theme the page is showing (Ralph, 13 Oct). With no JavaScript it's a
// <details> sheet of download links. With JavaScript, the phone's own share
// sheet gets the PNG (WhatsApp offers "My status" there); where a phone can't
// share files, the image downloads instead.
import Link from "next/link";
import { useEffect, useRef, type MouseEvent } from "react";
import type { CardImages } from "@/lib/screens/story";
import {
  sheet, sheetBackdrop, sheetCancel, sheetGrabber, sheetIcon, sheetOption, sheetOptionSub, sheetOptionTitle, sheetShape,
  sheetText, sheetTitle, storyShare, storyShareWrap,
} from "@/lib/variants";
import { ShareIcon } from "../ui/icons";
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
}

interface ShareSheetProps {
  readonly images: CardImages;
  /** e.g. "squad-battle-gw5-oga"; the format is added. */
  readonly filename: string;
  /** Where Cancel goes with no JavaScript: this card's page. */
  readonly cardHref: string;
  /** The league's public page, sent with the image (a Status caption, the post's text on X). */
  readonly pageHref: string;
  readonly labels: ShareLabels;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

type CardFormat = keyof CardImages;
type CardTheme = keyof CardImages[CardFormat];
type Option = "status" | "x" | "save";
const OPTIONS: readonly Option[] = ["status", "x", "save"];
const SHAPE = { status: "tall", x: "square", save: "both" } as const;
const THEMES: readonly CardTheme[] = ["light", "dark"];

function download(url: string, name: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
}

export function ShareSheet({ images, filename, cardHref, pageHref, labels, open, onOpenChange }: ShareSheetProps) {
  // The PNGs are fetched when the sheet opens, so sharing starts straight from
  // the tap: phones only allow the share sheet right after a tap.
  const files = useRef(new Map<string, Promise<Blob>>());
  useEffect(() => {
    if (!open) return;
    const theme = shownTheme();
    for (const format of ["status", "x"] as const) {
      const url = images[format][theme];
      if (!files.current.has(url)) files.current.set(url, fetch(url).then((response) => response.blob()));
    }
  }, [open, images]);

  const name = (format: CardFormat) => `${filename}-${format}.png`;

  async function share(format: CardFormat, url: string) {
    try {
      const blob = await (files.current.get(url) ?? fetch(url).then((response) => response.blob()));
      const file = new File([blob], name(format), { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: labels.title, text: new URL(pageHref, window.location.origin).href });
        onOpenChange(false);
        return;
      }
    } catch (failure) {
      if (failure instanceof DOMException && failure.name === "AbortError") return; // they closed the share sheet
    }
    download(url, name(format));
    onOpenChange(false);
  }

  const choose = (option: Option, theme: CardTheme) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (option === "save") {
      download(images.status[theme], name("status"));
      download(images.x[theme], name("x"));
      onOpenChange(false);
    } else {
      void share(option, images[option][theme]);
    }
  };

  const text = {
    status: [labels.status, labels.statusSub],
    x: [labels.x, labels.xSub],
    save: [labels.save, labels.saveSub],
  } as const;

  return (
    <details open={open} onToggle={(event) => onOpenChange(event.currentTarget.open)} className={storyShareWrap()}>
      <summary className={storyShare()}>
        <ShareIcon />
        {labels.share}
      </summary>
      <div aria-hidden="true" className={sheetBackdrop()} onClick={() => onOpenChange(false)} />
      <div role="dialog" aria-modal="true" aria-labelledby="share-title" className={sheet()}>
        <span aria-hidden="true" className={sheetGrabber()} />
        <h2 id="share-title" className={sheetTitle()}>
          {labels.title}
        </h2>
        {OPTIONS.flatMap((option) =>
          THEMES.map((theme) => (
            <a
              key={`${option}-${theme}`}
              href={images[option === "save" ? "status" : option][theme]}
              download={name(option === "x" ? "x" : "status")}
              onClick={choose(option, theme)}
              className={sheetOption({ theme })}
            >
              <span aria-hidden="true" className={sheetIcon()}>
                <span className={sheetShape({ shape: SHAPE[option] })} />
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
            onOpenChange(false);
          }}
          className={sheetCancel()}
        >
          {labels.cancel}
        </Link>
      </div>
    </details>
  );
}
