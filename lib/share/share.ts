// Sharing a card as an image, not a link. Runs in the browser; the browser
// pieces (share sheet, downloads, new tabs) come in as a ShareEnv so tests can
// fake them.
//
// What the web allows (13 Oct 2026): no site can post straight into WhatsApp
// Status or X. The closest is the phone's own share sheet holding the PNG:
// WhatsApp then offers "My status", and X opens its composer with the image.
//
// Two rules make that work:
// - Send the file alone. With text or a URL beside it, WhatsApp on iPhone
//   keeps the link and drops the image. The card's watermark carries the address.
// - Call the share sheet inside the tap. Phones refuse it once the tap is
//   stale, so images are fetched when the sheet opens (prefetch), and a tap
//   that had to wait for its image may need a second tap.

export type ShareTarget = "status" | "x";

export type ShareOutcome =
  /** The phone's share sheet took the image. */
  | "shared"
  /** They closed the phone's share sheet. */
  | "cancelled"
  /** No file sharing here (most computers): the image was saved, and for X the composer opened. */
  | "downloaded"
  /** The image arrived after the tap went stale. It's ready now: the next tap shares it. */
  | "tap-again"
  /** The image couldn't be fetched. */
  | "failed";

export interface ShareEnv {
  /** Whether this browser can hand these files to the phone's share sheet. */
  readonly canShareFiles: (files: File[]) => boolean;
  readonly share: (data: { files: File[] }) => Promise<void>;
  readonly download: (url: string, filename: string) => void;
  readonly open: (url: string) => void;
}

/** The real browser. Call it in the browser only. */
export function browserShareEnv(): ShareEnv {
  return {
    canShareFiles: (files) => typeof navigator.canShare === "function" && navigator.canShare({ files }),
    share: (data) => navigator.share(data),
    download: (url, filename) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
    },
    open: (url) => {
      window.open(url, "_blank", "noopener");
    },
  };
}

/** Card images fetched ahead of the tap, so the share sheet opens inside it. */
export interface ImageCache {
  /** Starts fetching; safe to call again. */
  readonly prefetch: (url: string) => void;
  /** The image, if it has arrived. */
  readonly ready: (url: string) => Blob | undefined;
  readonly load: (url: string) => Promise<Blob>;
}

async function fetchImage(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`card image ${response.status}`);
  return response.blob();
}

export function createImageCache(load: (url: string) => Promise<Blob> = fetchImage): ImageCache {
  const pending = new Map<string, Promise<Blob>>();
  const arrived = new Map<string, Blob>();
  const start = (url: string): Promise<Blob> => {
    const existing = pending.get(url);
    if (existing) return existing;
    const loading = load(url).then(
      (blob) => {
        arrived.set(url, blob);
        return blob;
      },
      (failure: unknown) => {
        pending.delete(url); // let the next tap try again
        throw failure;
      },
    );
    pending.set(url, loading);
    return loading;
  };
  return {
    prefetch: (url) => void start(url).catch(() => {}),
    ready: (url) => arrived.get(url),
    load: start,
  };
}

/** X's composer with the league's page, whose link preview shows the Wrapped card. */
export const xComposeUrl = (pageUrl: string): string => `https://x.com/intent/post?url=${encodeURIComponent(pageUrl)}`;

const errorName = (failure: unknown) => (failure instanceof Error || failure instanceof DOMException ? failure.name : "");

export interface ShareCardInput {
  /** The card PNG: tall for Status, square for X. */
  readonly url: string;
  readonly filename: string;
  readonly target: ShareTarget;
  /** Absolute URL of the league's public page, for X's composer on a computer. */
  readonly pageUrl: string;
}

/** Hands the card image to the phone's share sheet, or saves it where phones' sharing isn't available. */
export async function shareCard(input: ShareCardInput, cache: ImageCache, env: ShareEnv): Promise<ShareOutcome> {
  const probe = new File([], input.filename, { type: "image/png" });
  if (!env.canShareFiles([probe])) {
    // Both happen inside the tap, so neither is blocked.
    env.download(input.url, input.filename);
    if (input.target === "x") env.open(xComposeUrl(input.pageUrl));
    return "downloaded";
  }

  let blob = cache.ready(input.url);
  const waited = !blob;
  if (!blob) {
    try {
      blob = await cache.load(input.url);
    } catch {
      return "failed";
    }
  }

  const file = new File([blob], input.filename, { type: blob.type || "image/png" });
  try {
    await env.share({ files: [file] });
    return "shared";
  } catch (failure) {
    const name = errorName(failure);
    if (name === "AbortError") return "cancelled";
    if (name === "NotAllowedError" && waited) return "tap-again";
    env.download(input.url, input.filename);
    return "downloaded";
  }
}
