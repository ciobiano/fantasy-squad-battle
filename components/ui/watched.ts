"use client";

// Which story cards this phone has watched, per league and gameweek (localStorage,
// shaped by lib/remembered). Read as an external store, so the story circles
// update as soon as the viewer marks a card, even in another tab.
import { useMemo, useSyncExternalStore } from "react";
import { readWatched, watchedKey, withWatched } from "@/lib/remembered";

const CHANGED = "fsb-watched";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Nothing counts as watched on the server or before hydration: rings start bright. */
export function useWatched(leagueId: string, gw: number): ReadonlySet<string> {
  const key = watchedKey(leagueId, gw);
  const raw = useSyncExternalStore(subscribe, () => stored(key), () => null);
  return useMemo(() => readWatched(raw), [raw]);
}

export function markWatched(leagueId: string, gw: number, card: string): void {
  const key = watchedKey(leagueId, gw);
  try {
    localStorage.setItem(key, withWatched(stored(key), card));
  } catch {
    // Private mode: the ring stays bright, nothing else breaks.
  }
  window.dispatchEvent(new Event(CHANGED));
}
