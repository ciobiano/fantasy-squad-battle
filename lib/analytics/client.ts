import type { ClientEvent, EventProps } from "./events";

// The browser's half of analytics: a few hundred bytes, no PostHog library.
// Events go to our own /api/signal, which checks them and passes them on.
// Type imports only, so zod and the server code stay out of the page.

export const SIGNAL_PATH = "/api/signal";

/** Counts a share or a download. Fire and forget: never throws, never waits. */
export function track<E extends ClientEvent>(event: E, props: EventProps[E]): void {
  try {
    const body = JSON.stringify({ event, props });
    const sent =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(SIGNAL_PATH, new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch(SIGNAL_PATH, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
        () => {},
      );
    }
  } catch {
    // Counting must never get in the way of sharing.
  }
}
